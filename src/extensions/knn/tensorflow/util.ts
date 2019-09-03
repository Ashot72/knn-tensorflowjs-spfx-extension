// (value−min)/(max−min)
export const normalize = (tensor, min = null, max = null) => {
    if (!min) { min = tensor.min(0); }
    if (!max) { max = tensor.max(0); }

    return tensor.sub(min).div(max.sub(min));
};

// (value−μ)/σ
export const standardize = (tensor, mean, variance) =>
    tensor.sub(mean).div(variance.sqrt());
