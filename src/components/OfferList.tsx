import { useAccount } from "wagmi";
import Offer from "./Offer";

type OfferListParams = {
  loading: boolean;
  error: any;
  items: any[];
  filtered?: boolean;
  fetchOrders: () => void;
};

function OfferList({
  loading,
  error,
  items,
  fetchOrders,
  filtered,
}: OfferListParams) {
  const account = useAccount();
  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  const itemsToBeDisplayed = filtered
    ? items.filter(
        (i) =>
          i.requesterAddress === account.address ||
          i.fullfillerAddress === account.address
      )
    : items;
  return (
    <section>
      {itemsToBeDisplayed.map((offer) => (
        <Offer offer={offer} key={offer.id} fetchOrders={fetchOrders} />
      ))}
      {itemsToBeDisplayed.length === 0 && (
        <>
          <h3>No offers found. Create one with the form to the left.</h3>
        </>
      )}
    </section>
  );
}

export default OfferList;
