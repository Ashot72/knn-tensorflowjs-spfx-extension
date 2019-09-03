import { BaseDialog } from "@microsoft/sp-dialog";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import KnnModal from './knn-modal';

export default class Container extends BaseDialog {
    public listId: string;

    public render() {
        const knnModal = (<KnnModal
            onDismiss={this.close}
            listId={this.listId}
        />);

        ReactDOM.render(knnModal, this.domElement);
    }

    protected onAfterClose(): void {
        ReactDOM.unmountComponentAtNode(this.domElement);
    }
}
