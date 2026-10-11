function getPrice(size = "") {
    if (size && product) {
        // Check the sizePrices map, if it exists.
        const sizePrices = product.sizePrices || {};

        if (Object.prototype.hasOwnProperty.call(sizePrices, size)) {
            const price = Number(sizePrices[size]);

            if (Number.isFinite(price)) {
                return price;
            }
        }

        // Check the existing top-level Firebase price fields.
        if (Object.prototype.hasOwnProperty.call(product, size)) {
            const price = Number(product[size]);

            if (Number.isFinite(price)) {
                return price;
            }
        }
    }

    return Number(product?.price) || 0;
}
