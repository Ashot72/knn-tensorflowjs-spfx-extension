import * as React from 'react';
import * as strings from 'KnnCommandSetStrings';
import { String } from 'typescript-string-operations';
import { find } from 'lodash';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownStyles, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { ChoiceGroup } from 'office-ui-fabric-react/lib/ChoiceGroup';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import ICommonProps from '../common-props';
import IPredictionState from '../prediction/prediction-state';
import TestAndPredict from '../../../tensorflow/testAndPredict';
import { columns, round } from '../util';
import { Analysis, DataTransformation } from '../../../enums';

export default class Prediction extends React.Component<ICommonProps, IPredictionState> {

    public state: IPredictionState = {
        selectedFeatures: [],
        selectedLabel: '',
        k: '3',
        analysis: '',
        result: '',
        inputs: [],
        dataTransformation: DataTransformation.None,
        errors: []
    };

    private dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 250 } };

    public render(): JSX.Element {
        const { fields } = this.props;
        const { selectedFeatures, selectedLabel, k, errors, inputs, result } = this.state;

        return (
            <div>
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
                <Stack horizontal horizontalAlign="center">
                    <TextField
                        label="K"
                        required
                        type="number"
                        value={k}
                        onChange={this.onKChange}
                        styles={{ fieldGroup: { width: 70 } }}
                    />
                </Stack>
                <Stack horizontal horizontalAlign="center">
                    {inputs.map(({ key }) =>
                        <div style={{ margin: '7px' }}>
                            <TextField
                                label={`${key}`}
                                required
                                type="number"
                                onChange={e => this.onInputChange(key, e)}
                                styles={{ fieldGroup: { width: 90 } }}
                            />
                        </div>
                    )}
                </Stack>
                <Stack horizontal horizontalAlign="center">
                    <div style={{ fontSize: '16px' }}>
                        {result !== '' && <span><b>{String.Format(strings.predResult, selectedLabel, result)}</b></span>}
                    </div>
                </Stack>
                <Stack horizontal horizontalAlign="end">
                    <PrimaryButton
                        onClick={this.run}
                        text={strings.run}
                        style={{ marginTop: '5px', marginRight: '40px' }} />
                </Stack>
            </div>
        );
    }

    private run = () => {
        const errors = [];

        const { fields } = this.props;
        const { selectedFeatures, selectedLabel, inputs, analysis, k } = this.state;

        if (selectedFeatures.length === 0) { errors.push(strings.errSelFeaturePls); }

        selectedFeatures.forEach(feature => {
            if (!find(fields, (f: any) => f.key === feature).isFieldNumber) {
                errors.push(String.Format(strings.errSelFeatureType, feature));
            }
        });

        if (!selectedLabel) { errors.push(strings.errSelLabelPls); }

        if (!analysis) { errors.push(strings.errSelClassOrReg); }

        if (!k) { errors.push(strings.errK); }

        if (selectedFeatures.indexOf(selectedLabel as string) !== -1) {
            errors.push(String.Format(strings.errLabelSel, selectedLabel));
        }

        if (selectedLabel && !find(fields, (f: any) => f.key === selectedLabel).isFieldNumber) {
            errors.push(String.Format(strings.errSelLabelType, selectedLabel));
        }

        inputs.forEach(({ key, value }) => {
            if (!value) {
                errors.push(String.Format(strings.errFeatureEmpty, key));
            } else {
                if (isNaN(+value)) {
                    errors.push(String.Format(strings.errFeatureValue, key));
                }
            }
        });

        if (errors.length > 0) {
            this.setState({ errors });
        } else {
            this.clearErrors();
            this.predict();
        }
    }

    private predict() {
        const { selectedFeatures, selectedLabel, analysis, dataTransformation } = this.state;

        let features = columns(this.props.data, selectedFeatures);
        let labels = columns(this.props.data, selectedLabel);

        const testPoint = [];
        this.state.inputs.forEach(({ value }) => testPoint.push(+value));

        const prediction = new TestAndPredict(features, labels);
        prediction.predict([testPoint], analysis, dataTransformation, +this.state.k, cb =>
            this.setState({ result: round(cb.prediction) }));
    }

    private addTextField = key => {
        const inputs = [...this.state.inputs];
        inputs.push({ key, value: null });
        this.setState({ inputs });
    }

    private removeTextField = key => {
        const inputs = this.state.inputs.filter(i => i.key !== key);
        this.setState({ inputs });
    }

    private onInputChange = (key, e: any) => {
        const input = find(this.state.inputs, i => i.key === key);
        input.value = e.target.value;
    }

    private onFeatureChange = (ev: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
        const newSelectedFeatures = [...this.state.selectedFeatures];

        if (item.selected) {
            newSelectedFeatures.push(item.key as string);
            this.addTextField(item.key);
        } else {
            const currIndex = newSelectedFeatures.indexOf(item.key as string);
            if (currIndex > -1) {
                newSelectedFeatures.splice(currIndex, 1);
                this.removeTextField(item.key);
            }
        }

        this.setState({ selectedFeatures: newSelectedFeatures });

        newSelectedFeatures.indexOf(this.state.selectedLabel as string) !== -1
            ? this.setState({ errors: [String.Format(strings.errFeatureSel, this.state.selectedLabel)] })
            : this.clearErrors();
    }

    private onLabelChange = (ev: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
        this.setState({ selectedLabel: item.key as string });

        this.state.selectedFeatures.indexOf(item.key as string) !== -1
            ? this.setState({ errors: [String.Format(strings.errLabelSel, item.key)] })
            : this.clearErrors();
    }

    private onAnalysisChange = (ev: React.FormEvent<HTMLInputElement>, option: any): void =>
        this.setState({ analysis: option.key })

    private onTransformationChange = (ev: React.FormEvent<HTMLInputElement>, option: any): void =>
        this.setState({ dataTransformation: option.key })

    private onKChange = (ev: React.FormEvent<HTMLInputElement>, newValue?: string) => {
        newValue && !isNaN(+newValue) && +newValue > 0
            ? this.setState({ k: newValue })
            : this.setState({ k: '' });
    }

    private closeMessageBar = (): void => this.clearErrors();

    private clearErrors = () => this.setState({ errors: [] });
}