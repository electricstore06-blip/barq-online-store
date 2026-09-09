const products = [
  {id:1,name:"Premium Face Cream",category:"Cosmetics",price:18.99,icon:"🧴",desc:"Daily moisturizing skincare essential."},
  {id:2,name:"Wireless Headphones",category:"Electronics",price:39.99,icon:"🎧",desc:"Comfortable sound for everyday use."},
  {id:3,name:"LED Work Light",category:"Electronics",price:24.50,icon:"🔦",desc:"Bright portable light for home or work."},
  {id:4,name:"PVC Pipe Fitting Set",category:"Plumbing",price:12.75,icon:"🚰",desc:"Useful fittings for plumbing projects."},
  {id:5,name:"Adjustable Wrench",category:"Tools",price:15.90,icon:"🔧",desc:"Reliable tool for repairs and maintenance."},
  {id:6,name:"Electric Drill",category:"Tools",price:59.99,icon:"🛠️",desc:"Versatile drill for home projects."},
  {id:7,name:"Water Valve",category:"Plumbing",price:9.50,icon:"🚿",desc:"Durable valve for plumbing systems."},
  {id:8,name:"Makeup Brush Set",category:"Cosmetics",price:14.99,icon:"💄",desc:"Soft brushes for everyday makeup."}
];

let cart = JSON.parse(localStorage.getItem("barqCart") || "[]");
let activeCategory = "All";

const grid = document.getElementById("productGrid");
const search = document.getElementById("searchInput");
const empty = document.getElementById("emptyState");
const count = document.getElementById("cartCount");
const cartPanel = document.getElementById("cartPanel");
const overlay = document.getElementById("overlay");

function money(n){ return "$" + n.toFixed(2); }

function renderProducts(){
  const q = search.value.toLowerCase().trim();
  const filtered = products.filter(p =>
    (activeCategory === "All" || p.category === activeCategory) &&
    `${p.name} ${p.category} ${p.desc}`.toLowerCase().includes(q)
  );
  grid.innerHTML = filtered.map(p => `
    <article class="product">
      <div class="product-img">${p.icon}</div>
      <div class="product-body">
        <span class="tag">${p.category}</span>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="price-row">
          <span class="price">${money(p.price)}</span>
          <button class="add-btn" onclick="addToCart(${p.id})">+ Add</button>
        </div>
      </div>
    </article>`).join("");
  empty.hidden = filtered.length !== 0;
}

function addToCart(id){
  const item = cart.find(x => x.id === id);
  if(item) item.qty++;
  else cart.push({id, qty:1});
  saveCart();
  openCart();
}

function removeFromCart(id){
  cart = cart.filter(x => x.id !== id);
  saveCart();
}

function changeQty(id, delta){
  const item = cart.find(x => x.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart();
}

function renderCart(){
  const items = document.getElementById("cartItems");
  if(!cart.length){
    items.innerHTML = `<p style="text-align:center;color:#667085;padding:50px 0">Your cart is empty.</p>`;
  } else {
    items.innerHTML = cart.map(item => {
      const p = products.find(x => x.id === item.id);
      return `<div class="cart-item">
        <div class="thumb">${p.icon}</div>
        <div><h4>${p.name}</h4><small>${money(p.price)} × ${item.qty}</small><br>
        <button class="remove" onclick="removeFromCart(${p.id})">Remove</button></div>
        <div><button class="remove" onclick="changeQty(${p.id},1)">＋</button>
        <span>${item.qty}</span><button class="remove" onclick="changeQty(${p.id},-1)">−</button></div>
      </div>`;
    }).join("");
  }
  const total = cart.reduce((sum,item) => {
    const p = products.find(x => x.id === item.id);
    return sum + p.price * item.qty;
  },0);
  count.textContent = cart.reduce((sum,x)=>sum+x.qty,0);
  document.getElementById("cartTotal").textContent = money(total);
}

function saveCart(){
  localStorage.setItem("barqCart", JSON.stringify(cart));
  renderCart();
}

function openCart(){ cartPanel.classList.add("open"); overlay.classList.add("show"); cartPanel.setAttribute("aria-hidden","false"); }
function closeCart(){ cartPanel.classList.remove("open"); overlay.classList.remove("show"); cartPanel.setAttribute("aria-hidden","true"); }

document.querySelectorAll(".category-card").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".category-card").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    renderProducts();
    document.getElementById("products").scrollIntoView({behavior:"smooth"});
  });
});
search.addEventListener("input", renderProducts);
document.getElementById("cartButton").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.getElementById("checkoutButton").addEventListener("click", () => {
  if(!cart.length) return alert("Your cart is empty.");
  alert("Checkout demo: connect this button to your payment/order system when you're ready.");
});

renderProducts();
renderCart();
