declare interface IKnnCommandSetStrings {
  accuracy: string;
  analysis: string;
  classResult: string
  classification: string;
  clear: string;
  close: string;
  dataTransform: string;
  errBothFeatures: string;
  errK: string;
  errLabelSel: string;
  errSelLabelType: string;
  errFeatureSel: string;
  errFeatureEmpty: string;
  errSelClassOrReg: string;
  errSelLabelPls: string;
  errFeatureXNumber: string;
  errFeatureYNumber: string;
  errSelFeaturePls: string;
  errSelFeatureType: string;
  errFeatureValue: string;
  errSelFeatureX: string;
  errSelFeatureY: string;
  errTrainingSet: string;
  errTestingSetNum: string;
  errTestingSenLess: string;
  featureX: string;
  featureY: string;
  features: string;
  knnAnalysis: string;
  knnResult: string;
  label: string;
  minMax: string;
  minMaxAbbr: string;
  none: string;
  numberOfRec: string;
  numRecPerc: string;
  prediction: string;
  predResult: string;
  regression: string;
  regResult: string;
  run: string;
  selFeature: string;
  selFeatures: string;
  selLabel: string;
  tensorFlow: string;
  test: string;
  testingSet: string;
  zscore: string;
  zscoreAbbr: string;
  wait: string;
}

declare module 'KnnCommandSetStrings' {
  const strings: IKnnCommandSetStrings;
  export = strings;
}
