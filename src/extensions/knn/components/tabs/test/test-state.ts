import ICommonState from "../common-state";

export default interface ITestState extends ICommonState {
    testingSet: string;
    results: [];
    percentage: number;
}
