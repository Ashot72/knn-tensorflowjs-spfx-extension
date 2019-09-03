import * as React from 'react';
import * as strings from 'KnnCommandSetStrings';
import styles from './test.module.scss';
import { String } from 'typescript-string-operations';
import { find, slice, shuffle } from 'lodash';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownStyles, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { ChoiceGroup } from 'office-ui-fabric-react/lib/ChoiceGroup';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import ICommonProps from '../common-props';
import ITestState from './test-state';
import TestAndPredict from '../../../tensorflow/testAndPredict';
import { columns, round } from '../util';
import { Analysis, DataTransformation } from '../../../enums';

export default class Test extends React.Component<ICommonProps, ITestState> {
    private msgBoxSel: boolean;
    private msgBox: HTMLElement;

    public state: ITestState = {
        selectedFeatures: [],
        selectedLabel: '',
        testingSet: '',
        results: [],
        k: '3',
        percentage: 0,
        analysis: '',
        dataTransformation: DataTransformation.None,
        errors: []
    };

    private dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 250 } };

    public async componentDidMount() {
        setInterval(this.updateScroll, 1000);
    }

    public async componentWillReceiveProps(nextProps) {
        this.setTrainingSet(nextProps);
    }

    public render(): JSX.Element {
        const { fields, data } = this.props;
        const { selectedFeatures, results, k, testingSet, percentage, errors } = this.state;

        return (
            <div>
                <div className={styles.numRec}>
                    {strings.numberOfRec} {fields.length > 0 ? <b>{data.length}</b> : strings.wait}
                </div>
                {errors.length > 0 &&
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={true}
                        onDismiss={this.closeMessageBar}
                        dismissButtonAriaLabel={strings.close}>
                        <ul style={{ margin: 0 }}>
                            {errors.map(e => (<li>{e}</li>))}
                        </ul>
                    </MessageBar>
                }
                <Stack horizontal horizontalAlign="space-around">
                    <Dropdown
                        placeholder={strings.selFeatures}
                        label={strings.features}
                        onChange={this.onFeatureChange}
                        selectedKeys={selectedFeatures}
                        multiSelect
                        options={fields}
                        required={true}
                        styles={this.dropdownStyles}
                    />
                    <Dropdown
                        placeholder={strings.selLabel}
                        label={strings.label}
                        onChange={this.onLabelChange}
                        options={fields}
                        required={true}
                        styles={this.dropdownStyles}
                    />
                </Stack>
                <Stack horizontal horizontalAlign="space-around">
                    <ChoiceGroup
                        options={[
                            {
                                key: Analysis.Classification,
                                text: strings.classification
                            },
                            {
                                key: Analysis.Regression,
                                text: strings.regression
                            }
                        ]}
                        onChange={this.onAnalysisChange}
                        label={strings.analysis}
                        required={true}
                    />
                    <ChoiceGroup
                        defaultSelectedKey={DataTransformation.None}
                        options={[
                            {
                                key: DataTransformation.None,
                                text: strings.none
                            },
                            {
                                key: DataTransformation.Normalize,
                                text: strings.minMax
                            },
                            {
                                key: DataTransformation.Standardise,
                                text: strings.zscore
                            }
                        ]}
                        onChange={this.onTransformationChange}
                        label={strings.dataTransform}
                    />
                </Stack>
                <Stack horizontal horizontalAlign="space-around">
                    <div style={{ margin: '7px' }}>
                        <TextField
                            label="K"
                            required
                            type="number"
                            value={k}
                            onChange={this.onKChange}
                            styles={{ fieldGroup: { width: 70 } }}
                        />
                    </div>
                    <div style={{ margin: '7px' }}>
                        <TextField
                            label={strings.testingSet}
                            required
                            type="number"
                            value={testingSet}
                            onChange={this.onTestingSetChange}
                            styles={{ fieldGroup: { width: 100 } }}
                        />
                        {percentage > 0 && <span><b>{percentage}</b> {strings.numRecPerc}</span>}
                    </div>
                </Stack>
                <Stack horizontal horizontalAlign="center" >
                    <div style={{ width: '90%' }}>
                        <div style={{ textAlign: 'center' }}>{strings.knnAnalysis}</div>
                        <div ref={el => this.msgBox = el}
                            className={styles.msgBox}
                            onMouseDown={this.onPreventScrolling}
                            onScroll={this.onPreventScrolling}
                        >
                            {results.length === 0
                                ? <div style={{ textAlign: 'center' }}>{strings.knnResult}</div>
                                : <ul>
                                    {results.map(x => (<li>{x}</li>))}
                                </ul>}
                        </div>
                    </div>
                </Stack>
                <Stack horizontal horizontalAlign="end">
                    <PrimaryButton
                        onClick={e => this.setState({ results: [] })}
                        disabled={results.length === 0}
                        text={strings.clear}
                        style={{ marginTop: '5px', marginRight: '10px' }} />
                    <PrimaryButton
                        onClick={this.run}
                        text={strings.run}
                        style={{ marginTop: '5px', marginRight: '40px' }} />
                </Stack>
            </div >
        );
    }

    private setTrainingSet(nextProps) {
        if (this.state.testingSet === '') {
            const { length } = nextProps.data;

            const val = Math.ceil(length * 10 / 100);
            this.setState({ testingSet: val.toString() });
            this.calcPercentage(val, length);
        }
    }

    private run = () => {
        const errors = [];

        const { data, fields } = this.props;
        const { selectedFeatures, selectedLabel, analysis, k, testingSet } = this.state;

        if (selectedFeatures.length === 0) { errors.push(strings.errSelFeaturePls); }

        selectedFeatures.forEach(feature => {
            if (!find(fields, (f: any) => f.key === feature).isFieldNumber) {
                errors.push(String.Format(strings.errSelFeatureType, feature));
            }
        });

        if (!selectedLabel) { errors.push(strings.errSelLabelPls); }

        if (!analysis) { errors.push(strings.errSelClassOrReg); }

        if (!k) { errors.push(strings.errK); }

        if (!testingSet) {
            errors.push(strings.errTrainingSet);
        } else if (isNaN(+testingSet)) {
            errors.push(strings.errTestingSetNum);
        } else {
            if (+testingSet >= data.length) {
                errors.push(strings.errTestingSenLess);
            }
        }
        if (selectedFeatures.indexOf(selectedLabel as string) !== -1) {
            errors.push(String.Format(strings.errLabelSel, selectedLabel));
        }

        if (selectedLabel && !find(fields, (f: any) => f.key === selectedLabel).isFieldNumber) {
            errors.push(String.Format(strings.errSelLabelType, selectedLabel));
        }

        if (errors.length > 0) {
            this.setState({ errors });
        } else {
            this.clearErrors();
            this.runAnalysis();
        }
    }

    private runAnalysis() {
        const { selectedFeatures, selectedLabel, testingSet, analysis, results, dataTransformation } = this.state;

        const shuffled = shuffle(this.props.data);

        let featureColumns = columns(shuffled, selectedFeatures);
        let labelColumn = columns(shuffled, selectedLabel);

        const features = slice(featureColumns, +testingSet);
        const testFeatures = slice(featureColumns, 0, +testingSet);

        const labels = slice(labelColumn, +testingSet);
        const testLabels = slice(labelColumn, 0, +testingSet);

        this.msgBoxSel = false;
        if (results.length > 0) {
            this.setState(state => ({ results: [...state.results, '------------------------------------------------------'] as any }));
        }

        const test = new TestAndPredict(features, labels, testFeatures, testLabels);
        test.test(analysis, dataTransformation, +this.state.k, (cb) => {
            const { analysis: anl, guess, label, formula } = cb;

            let message = '';
            anl === Analysis.Classification
                ? formula === undefined
                    ? message = String.Format(strings.classResult, guess, label)
                    : message = String.Format(strings.accuracy, round(formula))
                : message = String.Format(strings.regResult, round(guess), round(label), round(formula));

            this.setState(state => ({ results: [...state.results, message] as any }));
        });
    }

    private updateScroll = () => {
        if (this.msgBox && !this.msgBoxSel) {
            this.msgBox.scrollTop = this.msgBox.scrollHeight;
        }
    }

    private onKChange = (ev: React.FormEvent<HTMLInputElement>, newValue?: string) => {
        newValue && !isNaN(+newValue) && +newValue > 0
            ? this.setState({ k: newValue })
            : this.setState({ k: '' });
    }

    private calcPercentage = (val: number, count: number) => this.setState({ percentage: +(val / +count * 100).toFixed(2) });

    private closeMessageBar = (): void => this.clearErrors();

    private onPreventScrolling = () => this.msgBoxSel = true;

    private onTestingSetChange = (ev: React.FormEvent<HTMLInputElement>, newValue?: string) => {
        const { length } = this.props.data;

        if (newValue && !isNaN(+newValue) && +newValue > 0) {
            this.setState({ testingSet: (+newValue).toString() });
            this.calcPercentage(+newValue, length);
        } else {
            this.setState({ testingSet: '' });
            this.calcPercentage(-1, length);
        }
    }

    private onAnalysisChange = (ev: React.FormEvent<HTMLInputElement>, option: any): void =>
        this.setState({ analysis: option.key })

    private onTransformationChange = (ev: React.FormEvent<HTMLInputElement>, option: any): void =>
        this.setState({ dataTransformation: option.key })

    private onLabelChange = (ev: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
        this.setState({ selectedLabel: item.key as string });

        this.state.selectedFeatures.indexOf(item.key as string) !== -1
            ? this.setState({ errors: [String.Format(strings.errLabelSel, item.key)] })
            : this.clearErrors();
    }

    private onFeatureChange = (ev: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
        const newSelectedFeatures = [...this.state.selectedFeatures];

        if (item.selected) {
            newSelectedFeatures.push(item.key as string);
        } else {
            const currIndex = newSelectedFeatures.indexOf(item.key as string);
            if (currIndex > -1) {
                newSelectedFeatures.splice(currIndex, 1);
            }
        }

        this.setState({ selectedFeatures: newSelectedFeatures });

        newSelectedFeatures.indexOf(this.state.selectedLabel as string) !== -1
            ? this.setState({ errors: [String.Format(strings.errFeatureSel, this.state.selectedLabel)] })
            : this.clearErrors();
    }

    private clearErrors = () => this.setState({ errors: [] });
}

