const tf: any = require("tf");
import { countBy, toPairs, sortBy, last, first, reduce, chain } from 'lodash';
import { normalize, standardize } from './util';
import { Analysis, DataTransformation } from '../enums';


export default class TestAndPredict {
    private features;
    private labels;
    private testFeatures;
    private testLabels = [];

    public constructor(features, labels, testFeatures = null, testLabels = null) {
        this.features = tf.tensor(features);
        this.labels = tf.tensor(labels);

        if (testFeatures) { this.testFeatures = tf.tensor(testFeatures); }
        if (testLabels) { this.testLabels = testLabels; }
    }

    public test(analysis: string, transform: string, k: number, cb) {
        let correct = 0;

        const { features, testFeatures } = this.normalizedFeatures(transform);
        const testFeaturesArr = testFeatures.arraySync();

        testFeaturesArr.forEach((testPoint, i) => {
            const guess = tf.tidy(() => this.knn(features, tf.tensor(testPoint), analysis, transform, k));
            const label = this.testLabels[i][0];

            if (analysis === Analysis.Classification) {
                if (guess === label) { correct++; }
                cb({ analysis, guess, label });

                if (i === testFeaturesArr.length - 1) {
                    const formula = correct / testFeaturesArr.length * 100;
                    cb({ analysis, formula });
                }
            } else {
                const formula = (label - guess) / label * 100;
                cb({ analysis, guess, label, formula });
            }
        });
    }

    public predict(predictionPoint, analysis: string, transform: string, k: number, cb) {
        const { features } = this.normalizedFeatures(transform);

        predictionPoint = tf.tensor(predictionPoint);

        if (transform === DataTransformation.Normalize) {
            const min = this.features.min(0);
            const max = this.features.max(0);
            predictionPoint = normalize(predictionPoint, min, max);
        }
        const prediction = tf.tidy(() => this.knn(features, predictionPoint, analysis, transform, k));
        cb({ prediction });
    }

    private normalizedFeatures = (transform: string) =>
        tf.tidy(() => {
            let features = this.features;
            let testFeatures = this.testFeatures;

            if (transform === DataTransformation.Normalize) {
                features = normalize(this.features);
                if (testFeatures) {
                    testFeatures = normalize(this.testFeatures);
                }
            }

            return { features, testFeatures };
        })

    private classififcation = op =>
        chain(op)
            .countBy(row => row[1])
            .toPairs()
            .sortBy(row => row[1])
            .last()
            .first()
            .parseInt()
            .value()

    private regression = (op, k) =>
        chain(op)
            .reduce((acc, pair) => acc + pair[1], 0)
            .divide(k)
            .value()

    private knn(features, dataPoint, analysis: string, transform: string, k: number) {

        if (transform === DataTransformation.Standardise) {
            const { mean, variance } = tf.moments(features, 0);

            dataPoint = standardize(dataPoint, mean, variance);
            features = standardize(features, mean, variance);
        }

        const op = features
            .sub(dataPoint)
            .square()
            .sum(1)
            .sqrt()
            .expandDims(1)
            .concat(this.labels, 1)
            .arraySync()
            .sort((a, b) => a[0] - b[0])
            .slice(0, k);

        return analysis === Analysis.Classification
            ? this.classififcation(op)
            : this.regression(op, k);
    }


}