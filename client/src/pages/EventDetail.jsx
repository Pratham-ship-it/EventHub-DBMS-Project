import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  CheckCircle,
  AlertCircle,
  Star,
  Send,
  ArrowLeft,
  Building,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking form state
  const [ticketCount, setTicketCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setError('');
      try {
        const [eventRes, reviewsRes] = await Promise.allSettled([
          API.get(`/events/${id}`),
          API.get(`/reviews/event/${id}`)
        ]);

        if (eventRes.status === 'fulfilled') {
          setEvent(eventRes.value.data);
        } else {
          setError('Event not found or failed to load.');
        }

        if (reviewsRes.status === 'fulfilled') {
          setReviews(reviewsRes.value.data);
        }
      } catch (err) {
        setError('Error loading event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess(null);

    try {
      const res = await API.post('/bookings', {
        eventId: id,
        numberOfTickets: ticketCount
      });

      setBookingSuccess(res.data);
      // Update local available seats
      setEvent((prev) => ({
        ...prev,
        availableSeats: Math.max(0, prev.availableSeats - ticketCount)
      }));
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await API.post('/reviews', {
        eventId: id,
        rating: reviewRating,
        comment: reviewComment
      });

      // Add to reviews list with current user's name
      const newReview = {
        ...res.data,
        user: { name: user.name }
      };
      setReviews([newReview, ...reviews]);
      setReviewComment('');
      setReviewSuccess('Your review has been submitted!');
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'Unable to display this event.'}</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";
  const isSoldOut = event.availableSeats <= 0;
  const totalPrice = ticketCount * (event.ticketPrice || 0);

  const formatDateTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all events
        </Link>
      </div>

      {/* Main Grid: Details (Left 2 cols) & Booking Card (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Event details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Banner */}
          <div className="relative rounded-3xl overflow-hidden h-72 sm:h-96 shadow-lg bg-slate-950">
            <img
              src={event.bannerUrl || event.imageUrl || event.bannerImage || event.image || defaultImage}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = defaultImage;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

            {/* Badges on image */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900 shadow">
                {typeof event.category === 'object' && event.category !== null ? event.category.name : (event.category || 'General Event')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500 text-white shadow capitalize">
                {event.status || 'Upcoming'}
              </span>
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {event.title}
              </h1>
            </div>
          </div>

          {/* Quick Info bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Date & Time</p>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(event.startDateTime)}</p>
                <p className="text-slate-500 mt-0.5 text-[11px]">to {formatDateTime(event.endDateTime)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Location</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {typeof event.venue === 'object' && event.venue !== null ? event.venue.name : (event.venue || 'Main Auditorium')}
                </p>
                {typeof event.venue === 'object' && event.venue !== null && event.venue.city && (
                  <p className="text-slate-500 mt-0.5">{event.venue.city}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-400 font-medium">Seat Capacity</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {event.availableSeats} / {event.totalSeats} seats open
                </p>
                <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{
                      width: `${Math.round(((event.totalSeats - event.availableSeats) / (event.totalSeats || 1)) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* About This Event */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">About the Event</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {event.description || 'No detailed description provided for this event.'}
            </p>
          </div>

          {/* Venue & Organizer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Venue Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Building className="w-5 h-5 text-brand-600" />
                <h3>Venue Details</h3>
              </div>
              <div className="text-sm space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-800">
                  {typeof event.venue === 'object' && event.venue !== null ? event.venue.name : (event.venue || 'Designated Hall')}
                </p>
                {typeof event.venue === 'object' && event.venue !== null && (
                  <>
                    <p>{event.venue.address || 'Main Campus Ground'}</p>
                    <p>{event.venue.city}</p>
                  </>
                )}
                {event.venue?.capacity && (
                  <p className="text-xs text-slate-500 pt-1">
                    Maximum Hall Capacity: <strong>{event.venue.capacity} people</strong>
                  </p>
                )}
                {event.venue?.amenities && event.venue.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {event.venue.amenities.map((amenity, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Organizer Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <h3>Organizer</h3>
              </div>
              <div className="text-sm space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-800">{event.organizer?.name || 'Faculty / Club Coordinator'}</p>
                <p className="text-xs text-slate-500">{event.organizer?.email || 'events@college.edu'}</p>
                <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/60">
                  <span className="font-medium text-slate-700">Official Campus Event</span>
                  <p className="text-slate-500 mt-0.5">Tickets verified by DBMS transaction ledger.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews & Ratings Section */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Participant Reviews</h3>
                <p className="text-xs text-slate-500">{reviews.length} total reviews submitted</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-lg">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span>
                  {reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Submit Review Form (if logged in) */}
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Write a Review</h4>

                {reviewError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{reviewError}</p>
                )}
                {reviewSuccess && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">{reviewSuccess}</p>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    placeholder="Share your experience or questions regarding this event..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {reviewLoading ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <Link to="/login" className="text-brand-600 font-semibold underline">
                  Sign in
                </Link>{' '}
                to leave a rating and review for this event.
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4 pt-2">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev._id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">
                        {rev.user?.name || 'Anonymous Attendee'}
                      </p>
                      <div className="flex items-center">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No reviews yet for this event.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Ticket Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}`}
                </span>
                <span className="text-xs text-slate-500">/ person</span>
              </div>
            </div>

            {/* Booking State Notice */}
            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-800">Booking Confirmed!</h4>
                <p className="text-xs text-emerald-700">
                  Reserved {bookingSuccess.numberOfTickets} seat(s) successfully.
                </p>
                <div className="pt-2">
                  <Link
                    to="/my-bookings"
                    className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
                  >
                    View in My Bookings
                  </Link>
                </div>
              </div>
            ) : isSoldOut ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                <h4 className="text-sm font-bold text-red-800">Event is Sold Out</h4>
                <p className="text-xs text-red-600">
                  All {event.totalSeats} seats have been reserved. Check back later in case of cancellations.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-5">
                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Ticket Quantity Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Number of Tickets
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      disabled={ticketCount <= 1}
                      className="px-4 py-3 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-bold text-slate-900 text-sm">
                      {ticketCount}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.min(event.availableSeats, ticketCount + 1))}
                      disabled={ticketCount >= event.availableSeats}
                      className="px-4 py-3 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Max tickets available right now: {event.availableSeats}
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Ticket (x{ticketCount})</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Convenience Fee</span>
                    <span className="text-emerald-600 font-semibold">Free</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Amount</span>
                    <span className="text-brand-600">₹{totalPrice}</span>
                  </div>
                </div>

                {/* CTA Submit Button */}
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Ticket className="w-4 h-4" />
                  <span>{bookingLoading ? 'Reserving Seats...' : 'Book Tickets Now'}</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Instant seat lock via DBMS multi-doc transaction</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
