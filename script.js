let cart = [];


function addToCart(name, price){

    let existing = cart.find(item => item.name === name);


    if(existing){

        existing.quantity++;

    } else {

        cart.push({
            name: name,
            price: price,
            quantity: 1
        });

    }


    updateCart();

}



function updateCart(){

    let cartBox = document.getElementById("cartItems");
    let totalBox = document.getElementById("cartTotal");


    cartBox.innerHTML = "";

    let total = 0;


    cart.forEach(function(item,index){

        total += item.price * item.quantity;


        cartBox.innerHTML +=
        "<div class='cart-product'>" +

        "<div>" +
        "<strong>" + item.name + "</strong><br>" +
        item.price + " ريال x " + item.quantity +
        "</div>" +

        "<div>" +

        "<button onclick='changeQuantity("+index+",-1)'>−</button>" +

        "<button onclick='changeQuantity("+index+",1)'>+</button>" +

        "<button onclick='removeItem("+index+")'>✕</button>" +

        "</div>" +

        "</div>";

    });


    totalBox.innerHTML = "Total: " + total.toFixed(2) + " ريال";

}



function changeQuantity(index,value){

    cart[index].quantity += value;


    if(cart[index].quantity <= 0){

        cart.splice(index,1);

    }


    updateCart();

}



function removeItem(index){

    cart.splice(index,1);

    updateCart();

}
