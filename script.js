let cart = [];


function addToCart(name, price){

    let item = cart.find(product => product.name === name);


    if(item){

        item.quantity++;

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

    let box = document.getElementById("cartItems");
    let total = document.getElementById("cartTotal");
    let count = document.getElementById("cartCount");


    box.innerHTML = "";

    let sum = 0;
    let amount = 0;


    cart.forEach((item,index)=>{


        sum += item.price * item.quantity;
        amount += item.quantity;


        box.innerHTML += `

        <div>

        <b>${item.name}</b><br>

        ${item.price} ريال × ${item.quantity}

        <button onclick="changeQuantity(${index},1)">+</button>

        <button onclick="changeQuantity(${index},-1)">-</button>

        <button onclick="removeItem(${index})">X</button>

        </div>

        <hr>

        `;


    });



    total.innerHTML = sum + " ريال";

    count.innerHTML = amount;


}



function changeQuantity(index,value){

    cart[index].quantity += value;


    if(cart[index].quantity <=0){

        cart.splice(index,1);

    }


    updateCart();

}



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

    alert("Thank you for your order!");

}
window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;
window.checkout = checkout;
window.changeQuantity = changeQuantity;
window.removeItem = removeItem;
