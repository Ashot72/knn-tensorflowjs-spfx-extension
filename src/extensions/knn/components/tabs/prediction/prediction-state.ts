import ICommonState from "../common-state";

export default interface IPredictionState extends ICommonState {
    result: string;
    inputs: { key: string, value: string }[];
}