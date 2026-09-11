let cart = [];


function addToCart(name, price){

    let existing = cart.find(item => item.name === name);


    if(existing){

        existing.quantity++;

    } else {

        cart.push({
            name:name,
            price:price,
            quantity:1
        });

    }


    updateCart();

}



function updateCart(){

    let items = document.getElementById("cartItems");
    let totalBox = document.getElementById("cartTotal");


    items.innerHTML="";


    let total = 0;


    cart.forEach(function(item,index){


        total += item.price * item.quantity;



        let product = document.createElement("div");


        product.innerHTML = `

        <p>
        ${item.name}
        <br>
        $${item.price} x ${item.quantity}

        <button onclick="removeItem(${index})">
        ❌
        </button>

        </p>

        `;


        items.appendChild(product);


    });



    totalBox.innerHTML = total.toFixed(2);


}
document.getElementById("cartCount").innerHTML = cart.length;

document.getElementById("cartCount").innerHTML = cart.reduce((sum,item)=>sum + item.quantity,0);



function removeItem(index){

    cart.splice(index,1);

    updateCart();

}





function openCart(){

    document.getElementById("cartBox").style.display="block";

}





function closeCart(){

    document.getElementById("cartBox").style.display="none";

}
function checkout(){

    if(cart.length === 0){

        alert("Your cart is empty");

    } else {

        alert("Thank you for shopping with BARQ!");

    }

}

function updateCartCount(){

    let count = cart.length;

    document.getElementById("cartCount").innerHTML = count;

}
