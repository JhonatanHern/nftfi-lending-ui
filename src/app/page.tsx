"use client";
import OfferList from "@/components/OfferList";
import OfferMaker from "@/components/OfferMaker";
import { ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
function App() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = () => {
    fetch("/api/offers/all")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("obtained data: ", data);

        setItems(data.body); // Assuming data is an array of items
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <>
      <div className="flex justify-between">
        <section className="w-[25%]">
          <OfferMaker fetchOrders={fetchOrders} />
        </section>
        <section className="w-[72%]">
          <OfferList
            loading={loading}
            error={error}
            items={items}
            fetchOrders={fetchOrders}
          />
        </section>
      </div>
      <ToastContainer />
    </>
  );
}

export default App;
