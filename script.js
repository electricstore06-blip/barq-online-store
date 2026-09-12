async function loadProducts(){

try {

const querySnapshot = await getDocs(collection(db,"products"));

let products = [];


querySnapshot.forEach((doc)=>{

products.push({

id: doc.id,

...doc.data()

});

});


console.log(products);


displayProducts(products);


}

catch(error){

console.log("Firebase Error:",error);

}

}
