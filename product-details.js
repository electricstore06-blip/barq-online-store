function getPrice(size = "") {
    if (!product) return 0;

    const sizePrices = product.sizePrices || {};

    if (size && sizePrices[size] !== undefined) {
        return Number(sizePrices[size]) || 0;
    }

    if (size && product[size] !== undefined) {
        return Number(product[size]) || 0;
    }

    return Number(product.price) || 0;
}
