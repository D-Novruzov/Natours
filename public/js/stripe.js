import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51RbygcFNQBeexrUUBhjWAt4WZlq9mungUzeKlVW1eF2jvGFR8GYUcKKhzrlVLd9HY8tbk4PdUy2iHhN7ih9oxJTB00xaA0Iqay',
);
export const bookTour = async (tourId) => {
  //1) get the session from endpoint of th eapi
  try {
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
  //2)create checkout form + charge credit catrd
};
