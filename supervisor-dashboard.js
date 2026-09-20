/* ==========================================
   BARQ SUPERVISOR DASHBOARD
========================================== */

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #f5f6f8;
    color: #222;
}

.supervisor-page {
    min-height: 100vh;
}


/* ==========================================
   HEADER
========================================== */

.supervisor-header {
    background: #111;
    color: white;
    padding: 20px 30px;

    display: flex;
    justify-content: space-between;
    align-items: center;

    gap: 20px;
}

.supervisor-header h1 {
    margin: 0 0 5px;
    font-size: 28px;
}

.supervisor-header p {
    margin: 0;
    color: #ccc;
}

#logout-btn {
    background: #d62828;
    color: white;

    border: none;
    border-radius: 8px;

    padding: 11px 20px;

    font-size: 15px;
    font-weight: bold;

    cursor: pointer;
}

#logout-btn:hover {
    opacity: 0.85;
}


/* ==========================================
   MAIN CONTENT
========================================== */

.supervisor-content {
    width: 95%;
    max-width: 1200px;

    margin: 30px auto;
}


/* ==========================================
   WELCOME
========================================== */

.welcome-box {
    background: white;

    border-radius: 12px;

    padding: 25px;

    margin-bottom: 25px;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.welcome-box h2 {
    margin-top: 0;
}

.welcome-box p {
    color: #666;
}


/* ==========================================
   SUMMARY CARDS
========================================== */

.summary-grid {
    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap: 20px;

    margin-bottom: 30px;
}

.summary-card {
    background: white;

    border-radius: 12px;

    padding: 22px;

    text-align: center;

    box-shadow:
        0 2px 8px
        rgba(0, 0, 0, 0.08);
}

.summary-card h3 {
    margin: 0 0 12px;

    font-size: 16px;

    color: #666;
}

.summary-card strong {
    font-size: 32px;
}


/* ==========================================
   DASHBOARD SECTIONS
========================================== */

.dashboard-section {
    background: white;

    border-radius: 12px;

    padding: 25px;

    margin-bottom: 25px;

    box-shadow:
        0 2px 8px
        rgba(0, 0, 0, 0.08);
}

.section-header {
    display: flex;

    justify-content: space-between;
    align-items: center;

    margin-bottom: 20px;
}

.section-header h2 {
    margin: 0;
}

.section-header button {
    border: none;

    border-radius: 8px;

    padding: 9px 15px;

    background: #111;
    color: white;

    cursor: pointer;
}

.section-header button:hover {
    opacity: 0.85;
}


/* ==========================================
   DRIVERS
========================================== */

.driver-card {
    border: 1px solid #ddd;

    border-radius: 10px;

    padding: 15px;

    margin-bottom: 12px;

    display: flex;

    justify-content: space-between;

    align-items: center;

    gap: 15px;
}

.driver-info h3 {
    margin: 0 0 6px;
}

.driver-info p {
    margin: 4px 0;

    color: #666;
}

.driver-status {
    font-weight: bold;
}

.driver-status.active {
    color: green;
}

.driver-status.inactive {
    color: #888;
}


/* ==========================================
   ORDERS
========================================== */

.order-card {
    border: 1px solid #ddd;

    border-radius: 10px;

    padding: 18px;

    margin-bottom: 15px;
}

.order-card h3 {
    margin-top: 0;
}

.order-card p {
    margin: 7px 0;
}

.order-actions {
    margin-top: 15px;

    display: flex;

    align-items: center;

    gap: 10px;

    flex-wrap: wrap;
}

.order-actions select {
    padding: 8px;

    border: 1px solid #ccc;

    border-radius: 7px;
}


/* ==========================================
   MESSAGE
========================================== */

#supervisor-message {
    margin: 20px 0;

    padding: 12px;

    border-radius: 8px;

    text-align: center;

    font-weight: bold;
}


/* ==========================================
   MOBILE
========================================== */

@media (max-width: 800px) {

    .summary-grid {
        grid-template-columns:
            repeat(2, 1fr);
    }

    .supervisor-header {
        padding: 18px;
    }

    .supervisor-content {
        width: 92%;
    }

}


@media (max-width: 500px) {

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .supervisor-header {
        flex-direction: column;

        align-items: flex-start;
    }

    .driver-card {
        flex-direction: column;

        align-items: flex-start;
    }

}
