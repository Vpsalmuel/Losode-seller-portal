import { Link } from 'react-router-dom';
import { iconPromoCamera, iconShare } from '../assets';
import { storeUrl } from '../lib/format';
import { useSellerData } from '../state/SellerData';

/** "Book a Photoshoot" and "Share Your Store" cards shown at the foot of several pages. */
export function PromoCards() {
  const { store, notify } = useSellerData();
  if (!store) return null;
  const link = storeUrl(store);

  const copyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      notify('Store link copied');
    } catch {
      notify(`Copy failed — your link is ${link}`);
    }
  };

  return (
    <div className="grid grid--2">
      <div className="card promo">
        <div className="promo__icon promo__icon--peach">
          <img src={iconPromoCamera} width={24} height={24} alt="" />
        </div>
        <div className="promo__text">
          <p className="promo__title">Book a Photoshoot</p>
          <p className="promo__body">Get premium models and high-quality photography at the Losóde studio.</p>
        </div>
        <Link to="/photoshoots" className="btn btn--outline">
          Book Now
        </Link>
      </div>
      <div className="card promo">
        <div className="promo__icon promo__icon--blue">
          <img src={iconShare} width={24} height={24} alt="" />
        </div>
        <div className="promo__text">
          <p className="promo__title">Share Your Store</p>
          <p className="promo__body">{link}</p>
        </div>
        <button type="button" className="btn btn--dark" onClick={copyStoreLink}>
          Copy Link
        </button>
      </div>
    </div>
  );
}
