let cart = [];



function addToCart(name, price){


    let existing = cart.find(item => item.name === name);


    if(existing){

        existing.quantity++;

    }else{

        cart.push({

            name:name,
            price:price,
            quantity:1

        });

    }


    updateCart();

}






function updateCart(){


    let cartItems = document.getElementById("cartItems");

    let cartTotal = document.getElementById("cartTotal");

    let cartCount = document.getElementById("cartCount");


    cartItems.innerHTML = "";


    let total = 0;

    let count = 0;



    cart.forEach(function(item,index){


        total += item.price * item.quantity;

        count += item.quantity;



        cartItems.innerHTML += `

        <div class="cart-product">


        <strong>${item.name}</strong>

        <br>

        ${item.price} ريال x ${item.quantity}


        <br>


        <button onclick="changeQuantity(${index},-1)">
        -
        </button>


        <button onclick="changeQuantity(${index},1)">
        +
        </button>


        <button onclick="removeItem(${index})">
        ✕
        </button>


        </div>

        `;



    });



    cartTotal.innerHTML = total.toFixed(2);

    cartCount.innerHTML = count;


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


    if(cart.length === 0){

        alert("Your cart is empty");

        return;

    }



    alert("Thank you for shopping with BARQ ❤️");


    cart=[];


    updateCart();


    closeCart();


}
