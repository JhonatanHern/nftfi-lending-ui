import Offer from "./Offer";

type OfferListParams = {
  loading: boolean;
  error: any;
  items: any[];
  fetchOrders: () => void;
};

function OfferList({ loading, error, items, fetchOrders }: OfferListParams) {
  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <section>
      {items.map((offer) => (
        <Offer offer={offer} key={offer.id} fetchOrders={fetchOrders} />
      ))}
    </section>
  );
}

export default OfferList;
