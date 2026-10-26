// ============================================
// 1. OBSERVER PATTERN
// ============================================

class User {
    constructor(name) {
        this.name = name;
    }

    update(product, oldPrice, newPrice) {
        const message =
            `${this.name}: ${product.name} price dropped from ₹${oldPrice} to ₹${newPrice}.`;

        NotificationCenter.add(message);
    }
}

class Product {
    constructor(id, name, price) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.observers = [];
    }

    subscribe(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(
            item => item !== observer
        );
    }

    notify(oldPrice, newPrice) {
        this.observers.forEach(observer => {
            observer.update(this, oldPrice, newPrice);
        });
    }

    updatePrice(newPrice) {
        if (!Number.isFinite(newPrice) || newPrice <= 0) {
            alert("Please enter a valid price.");
            return;
        }

        const oldPrice = this.price;
        this.price = newPrice;

        if (newPrice < oldPrice) {
            this.notify(oldPrice, newPrice);
        }

        renderProducts();
        renderCart();
    }
}

class NotificationCenter {
    static messages = [];

    static add(message) {
        this.messages.unshift(message);
        this.render();
    }

    static render() {
        const container = document.getElementById("notifications");

        if (!container) return;

        container.replaceChildren();

        if (this.messages.length === 0) {
            container.textContent = "No notifications yet.";
            return;
        }

        this.messages.forEach(message => {
            const notification = document.createElement("div");

            notification.className = "notification";
            notification.textContent = message;

            container.appendChild(notification);
        });
    }
}


// ============================================
// 2. STRATEGY PATTERN
// ============================================

class PaymentStrategy {
    pay(amount) {
        throw new Error("pay() must be implemented.");
    }
}

class UPIPayment extends PaymentStrategy {
    pay(amount) {
        return `UPI payment selected for ₹${amount}.`;
    }
}

class CardPayment extends PaymentStrategy {
    pay(amount) {
        return `Card payment selected for ₹${amount}.`;
    }
}

class WalletPayment extends PaymentStrategy {
    pay(amount) {
        return `Wallet payment selected for ₹${amount}.`;
    }
}

class CheckoutService {
    constructor(strategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy) {
        this.strategy = strategy;
    }

    executePayment(amount) {
        return this.strategy.pay(amount);
    }
}


// ============================================
// 3. COMMAND PATTERN
// ============================================

class CartService {
    constructor() {
        this.items = [];
        this.discountRate = 0;
    }

    addItem(product) {
        const existingItem = this.items.find(
            item => item.product.id === product.id
        );

        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.items.push({
                product: product,
                quantity: 1
            });
        }
    }

    removeItem(productId) {
        const existingItem = this.items.find(
            item => item.product.id === productId
        );

        if (!existingItem) {
            throw new Error("Product not found in cart.");
        }

        existingItem.quantity--;

        if (existingItem.quantity === 0) {
            this.items = this.items.filter(
                item => item.product.id !== productId
            );
        }
    }

    getSubtotal() {
        return this.items.reduce((total, item) => {
            return total +
                item.product.price * item.quantity;
        }, 0);
    }

    getTotal() {
        return Math.round(
            this.getSubtotal() * (1 - this.discountRate)
        );
    }
}

class Command {
    execute() {
        throw new Error("execute() must be implemented.");
    }

    undo() {
        throw new Error("undo() must be implemented.");
    }
}


// Add Item Command

class AddItemCommand extends Command {
    constructor(cart, product) {
        super();
        this.cart = cart;
        this.product = product;
    }

    execute() {
        this.cart.addItem(this.product);
    }

    undo() {
        this.cart.removeItem(this.product.id);
    }
}


// Remove Item Command

class RemoveItemCommand extends Command {
    constructor(cart, product) {
        super();
        this.cart = cart;
        this.product = product;
    }

    execute() {
        this.cart.removeItem(this.product.id);
    }

    undo() {
        this.cart.addItem(this.product);
    }
}


// Apply Coupon Command

class ApplyCouponCommand extends Command {
    constructor(cart, discountRate) {
        super();
        this.cart = cart;
        this.discountRate = discountRate;
        this.previousRate = 0;
    }

    execute() {
        this.previousRate = this.cart.discountRate;
        this.cart.discountRate = this.discountRate;
    }

    undo() {
        this.cart.discountRate = this.previousRate;
    }
}


// Command Manager: Undo and Redo

class CommandManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    execute(command) {
        try {
            command.execute();

            this.undoStack.push(command);
            this.redoStack = [];

            renderCart();
        } catch (error) {
            alert(error.message);
        }
    }

    undo() {
        if (this.undoStack.length === 0) {
            alert("Nothing to undo.");
            return;
        }

        const command = this.undoStack[this.undoStack.length - 1];

        try {
            command.undo();

            this.undoStack.pop();
            this.redoStack.push(command);

            renderCart();
        } catch (error) {
            alert(error.message);
        }
    }

    redo() {
        if (this.redoStack.length === 0) {
            alert("Nothing to redo.");
            return;
        }

        const command = this.redoStack[this.redoStack.length - 1];

        try {
            command.execute();

            this.redoStack.pop();
            this.undoStack.push(command);

            renderCart();
        } catch (error) {
            alert(error.message);
        }
    }
}


// ============================================
// WEBSITE INITIALIZATION
// ============================================

const products = [
    new Product(1, "Wireless Headphones", 2000),
    new Product(2, "Smart Watch", 3500),
    new Product(3, "Bluetooth Speaker", 1500)
];

const currentUser = new User("Customer");

products.forEach(product => {
    product.subscribe(currentUser);
});

const cartService = new CartService();
const commandManager = new CommandManager();


// ============================================
// DISPLAY PRODUCTS
// ============================================

function renderProducts() {
    const container = document.getElementById("products");

    if (!container) return;

    container.replaceChildren();

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product";

        const title = document.createElement("h3");
        title.textContent = product.name;

        const price = document.createElement("p");
        price.className = "price";
        price.textContent = `₹${product.price}`;

        const addButton = document.createElement("button");
        addButton.textContent = "Add to Cart";

        addButton.addEventListener("click", () => {
            commandManager.execute(
                new AddItemCommand(cartService, product)
            );
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            commandManager.execute(
                new RemoveItemCommand(cartService, product)
            );
        });

        const subscribeButton = document.createElement("button");
        subscribeButton.textContent = "Subscribe";

        subscribeButton.addEventListener("click", () => {
            product.subscribe(currentUser);
            alert(`Subscribed to ${product.name}!`);
        });

        const priceButton = document.createElement("button");
        priceButton.textContent = "Simulate Price Drop";

        priceButton.addEventListener("click", () => {
            const newPrice = Math.max(
                1,
                Math.round(product.price * 0.9)
            );

            product.updatePrice(newPrice);
        });

        card.append(
            title,
            price,
            addButton,
            removeButton,
            subscribeButton,
            priceButton
        );

        container.appendChild(card);
    });
}


// ============================================
// DISPLAY SHOPPING CART
// ============================================

function renderCart() {
    const container = document.getElementById("cart");
    const totalElement = document.getElementById("total");

    if (!container || !totalElement) return;

    container.replaceChildren();

    if (cartService.items.length === 0) {
        container.textContent = "Your cart is empty.";
    }

    cartService.items.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item";

        row.textContent =
            `${item.product.name} x ${item.quantity} = ₹${item.product.price * item.quantity}`;

        container.appendChild(row);
    });

    totalElement.textContent = `Total: ₹${cartService.getTotal()}`;
}


// ============================================
// UNDO AND REDO BUTTONS
// ============================================

function undoAction() {
    commandManager.undo();
}

function redoAction() {
    commandManager.redo();
}


// ============================================
// APPLY COUPON
// ============================================

function applyCoupon() {
    const input = document.getElementById("couponCode");

    if (!input) return;

    const coupon = input.value.trim().toUpperCase();

    if (coupon !== "SAVE10") {
        alert("Invalid coupon. Please enter SAVE10.");
        return;
    }

    commandManager.execute(
        new ApplyCouponCommand(cartService, 0.10)
    );

    alert("10% discount applied successfully!");
}


// ============================================
// CHECKOUT AND PAYMENT STRATEGY
// ============================================

function checkout() {
    if (cartService.items.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const method = document.getElementById("paymentMethod").value;

    let strategy;

    switch (method) {
        case "upi":
            strategy = new UPIPayment();
            break;

        case "card":
            strategy = new CardPayment();
            break;

        case "wallet":
            strategy = new WalletPayment();
            break;

        default:
            alert("Please select a valid payment method.");
            return;
    }

    const checkoutService = new CheckoutService(strategy);

    const message = checkoutService.executePayment(
        cartService.getTotal()
    );

    document.getElementById("paymentMessage").textContent =
        `${message} Demo only. No actual payment was made.`;
}


// ============================================
// START APPLICATION
// ============================================

renderProducts();
renderCart();
NotificationCenter.render();