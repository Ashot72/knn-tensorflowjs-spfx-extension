import * as React from 'react';
import * as strings from 'KnnCommandSetStrings';
import styles from './knn-modal.module.scss';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import IKnnModalProps from './knn-modal-props';
import IKnnModalState from './knn-modal-state';
import ListService from '../services/list-service';
import { Prediction, Test, Plot } from './tabs';

export default class KnnModal extends React.Component<IKnnModalProps, IKnnModalState> {

    public state: IKnnModalState = {
        data: [],
        fields: [],
        error: '',
        selectedKey: 'test'
    };

    private listService: ListService;

    constructor(props: IKnnModalProps) {
        super(props);
        this.listService = new ListService();
    }

    public async componentDidMount() {
        const { listId } = this.props;

        const fields: Promise<any> = this.listService.getKnnListFields(listId);
        const data: Promise<any> = this.listService.getKnnList(listId);

        return Promise.all([fields, data])
            .then(([f, d]) => this.setState({ fields: f, data: d }))
            .catch(e => this.setState({ error: e.message }));
    }

    public render(): JSX.Element {
        const { fields, data, error } = this.state;

        return (
            <div>
                {error ?
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={true}
                        onDismiss={this.closeMessageBar}
                        dismissButtonAriaLabel={strings.close}>
                        {error}
                    </MessageBar>
                    : <Modal
                        isOpen={true}
                        isBlocking={true}
                        onDismiss={this.closeModal}
                    > <div>
                            <div className={styles.header}>
                                <span>{strings.tensorFlow}</span>
                                <div className={styles.close} onClick={this.closeModal}>
                                    <Icon iconName="ChromeClose" style={{ cursor: 'pointer' }} /></div>
                            </div>
                            <Pivot headersOnly={true} onLinkClick={this.onLinkClick} style={{ width: '50vw' }} >
                                <PivotItem headerText={strings.test} itemKey="test" />
                                <PivotItem headerText={strings.prediction} itemKey="prediction" />
                                <PivotItem headerText={strings.dataTransform} itemKey="dataTransfromation" />
                            </Pivot>
                            <div style={{ height: '650px', padding: '5px' }}>
                                <div style={{ display: this.showOrHide('test') }}>
                                    <Test fields={fields} data={data} />
                                </div>
                                <div style={{ display: this.showOrHide('prediction') }}>
                                    <Prediction fields={fields} data={data} />
                                </div>
                                <div style={{ display: this.showOrHide('dataTransfromation') }}>
                                    <Plot fields={fields} data={data} />
                                </div>
                            </div>
                        </div>
                    </Modal>
                }
            </div>
        );
    }

    private showOrHide = (tab: string) => this.state.selectedKey === tab ? 'block' : 'none';

    private onLinkClick = (item: PivotItem): void => this.setState({ selectedKey: item.props.itemKey });

    private closeMessageBar = (): void => this.setState({ error: '' });

    private closeModal = (): void => this.props.onDismiss();
}