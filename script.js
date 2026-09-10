let cart = [];
let total = 0;

function addToCart(name, price) {

    cart.push({
        name: name,
        price: price
    });

    total += price;

    updateCart();
}


function updateCart() {

    let items = document.getElementById("cartItems");
    let totalBox = document.getElementById("cartTotal");

    items.innerHTML = "";

    cart.forEach(function(item){

        let product = document.createElement("p");

        product.innerHTML = 
        item.name + " - $" + item.price;

        items.appendChild(product);

    });


    totalBox.innerHTML = total.toFixed(2);

}


function closeCart(){

    document.getElementById("cartBox").style.display = "none";

}
