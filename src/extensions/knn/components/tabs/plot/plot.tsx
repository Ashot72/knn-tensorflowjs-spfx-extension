const tfvis: any = require('tfvis');
import * as React from 'react';
import * as strings from 'KnnCommandSetStrings';
import { String } from 'typescript-string-operations';
import { find } from 'lodash';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { ChoiceGroup } from 'office-ui-fabric-react/lib/ChoiceGroup';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownStyles, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import ICommonProps from '../common-props';
import IPlotState from './plot-state';
import DataTransform from '../../../tensorflow/dataTransform';
import { columns } from '../util';
import { DataTransformation } from '../../../enums';

export default class Plot extends React.Component<ICommonProps, IPlotState> {

    public state: IPlotState = {
        selectedFeatureX: '',
        selectedFeatureY: '',
        dataTransformation: DataTransformation.None,
        errors: []
    };

    private dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 250 } };

    public render(): JSX.Element {
        const { fields } = this.props;
        const { errors } = this.state;

        return (
            <div>
                {errors.length > 0 &&
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={true}
                        onDismiss={this.closeMessageBar}
                        dismissButtonAriaLabel={strings.close}>
                        <ul style={{ margin: 0 }}>
                            {errors.map(e => <li>{e}</li>)}
                        </ul>
                    </MessageBar>
                }
                <Stack horizontal horizontalAlign="space-around">
                    <Dropdown
                        placeholder={strings.selFeature}
                        label={strings.featureX}
                        onChange={this.onFeatureChangeOnX}
                        options={fields}
                        required={true}
                        styles={this.dropdownStyles}
                    />
                    <Dropdown
                        placeholder={strings.selFeature}
                        label={strings.featureY}
                        onChange={this.onFeatureChangeOnY}
                        options={fields}
                        required={true}
                        styles={this.dropdownStyles}
                    />
                </Stack>
                <Stack horizontal horizontalAlign="space-around">
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
                <div ref="plot" style={{ padding: '5px' }}></div>
                <Stack horizontal horizontalAlign="end">
                    <PrimaryButton
                        onClick={this.run}
                        text={strings.run}
                        style={{ marginTop: '5px', marginRight: '40px' }} />
                </Stack>
            </div>
        );
    }

    private onFeatureChangeOnX = (ev: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
        this.setState({ selectedFeatureX: item.key as string });
    }

    private onFeatureChangeOnY = (ev: React.FormEvent<HTMLDivElement>, item: IDropdownOption): void => {
        this.setState({ selectedFeatureY: item.key as string });
    }

    private onTransformationChange = (ev: React.FormEvent<HTMLInputElement>, option: any): void =>
        this.setState({ dataTransformation: option.key })

    private closeMessageBar = (): void => this.clearErrors();

    private clearErrors = () => this.setState({ errors: [] });

    private run = () => {
        const errors = [];
        const { selectedFeatureX, selectedFeatureY } = this.state;

        if (!selectedFeatureX) { errors.push(strings.errSelFeatureX); }

        if (!selectedFeatureY) { errors.push(strings.errSelFeatureY); }

        if (selectedFeatureX && selectedFeatureY) {
            if (!find(this.props.fields, (f: any) => f.key === selectedFeatureX).isFieldNumber) {
                errors.push(String.Format(strings.errFeatureXNumber, selectedFeatureX));
            }

            if (!find(this.props.fields, (f: any) => f.key === selectedFeatureY).isFieldNumber) {
                errors.push(String.Format(strings.errFeatureYNumber, selectedFeatureY));
            }

            if (selectedFeatureX === selectedFeatureY) { errors.push(strings.errBothFeatures); }
        }
        if (errors.length > 0) {
            this.setState({ errors });
        } else {
            this.clearErrors();
            this.plot();
        }
    }

    private plot = () => {
        const { selectedFeatureX, selectedFeatureY, dataTransformation } = this.state;
        const { data: dt } = this.props;

        let featureX = columns(dt, selectedFeatureX);
        let featureY = columns(dt, selectedFeatureY);

        if (dataTransformation !== DataTransformation.None) {
            const dataTrans = new DataTransform(featureX, featureY);

            const transData = (dataTransformation === DataTransformation.Normalize)
                ? dataTrans.normalize()
                : dataTrans.standardize();

            featureX = transData.featureX;
            featureY = transData.featureY;
        }

        const norm_data = (arrX, arrY) => arrX.map((x, i) => ({ x, y: arrY[i] }));

        const label = dataTransformation === DataTransformation.None
            ? strings.none : dataTransformation === DataTransformation.Normalize
                ? strings.minMaxAbbr : strings.zscoreAbbr;

        const data = { values: [norm_data(featureX, featureY)], series: [label] };
        const title = key => find(this.props.fields, (f: any) => f.key === key).text;

        tfvis.render.scatterplot(
            this.refs.plot,
            data,
            {
                xLabel: title(selectedFeatureX),
                yLabel: title(selectedFeatureY),
                height: 350,
                width: 780,
                fontSize: 13
            });

    }
}
