import { override } from '@microsoft/decorators';
import { sp } from '@pnp/sp';
import {
  BaseListViewCommandSet,
  Command,
  IListViewCommandSetListViewUpdatedParameters,
  IListViewCommandSetExecuteEventParameters
} from '@microsoft/sp-listview-extensibility';
import Container from './components/container';

export interface IKnnCommandSetProperties {
  Lists: string;
}

export default class KnnCommandSet extends BaseListViewCommandSet<IKnnCommandSetProperties> {

  @override
  public onInit(): Promise<void> {
    return super.onInit().then(_ => {
      sp.setup({
        spfxContext: this.context
      });
    });
  }

  @override
  public async onListViewUpdated(event: IListViewCommandSetListViewUpdatedParameters): Promise<void> {
    const command: Command = this.tryGetCommand('knn');
    if (command) {
      let allowed = true;

      if (typeof this.properties.Lists !== "undefined" && this.properties.Lists.length > 0) {
        let lists = this.properties.Lists.split(',');
        allowed = lists.indexOf(this.context.pageContext.list.title) > -1;
      }

      command.visible = allowed;
    }
  }

  @override
  public async onExecute(event: IListViewCommandSetExecuteEventParameters): Promise<void> {

    switch (event.itemId) {
      case 'knn':
        const modal = new Container();
        modal.listId = this.context.pageContext.list.id.toString();
        modal.show();
        break;
      default:
        throw new Error('Unknown command');
    }
  }

}
