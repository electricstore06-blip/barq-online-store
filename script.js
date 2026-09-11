function updateCart(){

    let cartBox = document.getElementById("cartItems");
    let totalBox = document.getElementById("cartTotal");

    cartBox.innerHTML = "";

    let total = 0;


    cart.forEach((item,index)=>{

        total += item.price * item.quantity;


        cartBox.innerHTML += `
        
        <div class="cart-product">

            <div>
                <strong>${item.name}</strong>
                <br>
                ${item.price} ريال x ${item.quantity}
            </div>


            <div>

                <button onclick="changeQuantity(${index},-1)">
                −
                </button>

                <span>${item.quantity}</span>

                <button onclick="changeQuantity(${index},1)">
                +
                </button>


                <button onclick="removeItem(${index})">
                ✕
                </button>

            </div>

        </div>

        `;


    });


    totalBox.innerHTML = "Total: " + total.toFixed(2) + " ريال";

}
