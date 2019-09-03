const tf: any = require("tf");
import { normalize as n, standardize as s } from './util';

export default class DataTransform {
    private featureX;
    private featureY;

    public constructor(featureX, featureY) {
        this.featureX = tf.tensor(featureX);
        this.featureY = tf.tensor(featureY);
    }

    public normalize = () =>
        tf.tidy(() => ({
            featureX: n(this.featureX).arraySync(),
            featureY: n(this.featureY).arraySync()
        }))

    public standardize = () =>
        tf.tidy(() => {
            const { mean: mX, variance: vX } = tf.moments(this.featureX, 0);
            const { mean: mY, variance: vY } = tf.moments(this.featureY, 0);

            return {
                featureX: s(this.featureX, mX, vX).arraySync(),
                featureY: s(this.featureY, mY, vY).arraySync()
            };
        })
}