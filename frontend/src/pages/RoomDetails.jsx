import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { assets, facilityIcons, roomCommonData } from "../assets/assets";
import StarRating from "../components/StarRating";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const RoomDetails = () => {
  const { id } = useParams();

  const { rooms, getToken, axios, navigate } = useAppContext();

  const [room, setRoom] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [guests, setGuests] = useState(1);

  const [isAvailable, setIsAvailable] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  //check if the Room is Available
  const checkAvailability = async () => {
    try {
      setIsCheckingAvailability(true);
      
      if (!checkInDate || !checkOutDate) {
        toast.error("Please select both check-in and check-out dates.");
        setIsCheckingAvailability(false);
        return;
      }

      //check if checkInDate is greatet than checkOutDate
      if (new Date(checkInDate) >= new Date(checkOutDate)) {
        toast.error("Check-in date must be earlier than check-out date!!");
        setIsCheckingAvailability(false);
        return;
      }

      // Additional validation
      if (new Date(checkInDate) < new Date()) {
        toast.error("Check-in date cannot be in the past!");
        setIsCheckingAvailability(false);
        return;
      }

      const { data } = await axios.post('/api/bookings/check-availability',
        { room: id, checkInDate, checkOutDate });

      if (data.success) {
        if (data.isAvailable) {
          setIsAvailable(true);
          toast.success('Room is available');
        } else {
          setIsAvailable(false);
          toast.error('Room is not available');
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to check availability');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  //onSubmitHandler function to checkAvailability and book the room
  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();

      // Check if form is valid before proceeding
      if (!e.target.checkValidity()) {
        e.target.reportValidity();
        return;
      }

      if (!isAvailable) {
        return checkAvailability();
      } else {
        setIsBooking(true);
        setIsBooked(true); // Show "Booked" immediately
        const { data } = await axios.post('/api/bookings/book', { room: id, checkInDate, checkOutDate, guests, paymentMethod: "Pay At Hotel" }, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        })

        if (data.success) {
          toast.success(data.message);
          
          // Wait for 2 seconds to show the "Booked" state before navigating
          setTimeout(() => {
            navigate('/my-bookings');
            scrollTo(0, 0);
          }, 2000);
        } else {
          setIsBooking(false);
          setIsBooked(false);
          toast.error(data.message);
        }
      }
    } catch (error) {
      setIsBooking(false);
      toast.error(error.response?.data?.message || error.message || 'Failed to process booking');
    }
  }

  useEffect(() => {
    const room = rooms.find((room) => room._id === id);
    room && setRoom(room);
    room && setMainImage(room.images[0]);
  }, [rooms]);

  return (
    room && (
      <div className="py-28 md:py-35 md:px-16 lg:px-24 xl:px-32">
        {/* Room Details Header */}
        <div className="flex flex-row md:flex-row items-start md:items-center gap-2">
          <h1 className="text-3xl md:text-4xl font-playfair">
            {room.hotel.name}{" "}
            <span className="font-inter text-sm">({room.roomType})</span>
          </h1>
          <p className="text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full">
            20% OFF
          </p>
        </div>
        {/* Room Rating */}
        <div className="flex items-center gap-1 mt-2">
          <StarRating />
          <p className="ml-2">200+ reviews</p>
        </div>
        {/* Room Address */}
        <div className="flex items-center gap-1 text-gray-500 mt-2">
          <img src={assets.locationIcon} alt="location-icon" />
          <span>{room.hotel.address}</span>
        </div>
        {/* Room Images */}
        <div className="flex flex-col lg:flex-row mt-6 gap-6">
          <div className="lg:w-1/2 w-full">
            <img
              src={mainImage}
              alt="Room Images"
              className="w-full rounded-xl shadow-lg object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:w-1/2 w-full">
            {room?.images.length > 1 &&
              room.images.map((image, index) => (
                <img
                  onClick={() => setMainImage(image)}
                  key={index}
                  src={image}
                  alt="Room Image"
                  className={`w-full rounded-xl shadow-md object-cover cursor-pointer ${mainImage === image && "outline-3 outline-orange-500"
                    }`}
                />
              ))}
          </div>
        </div>
        {/*Room highlights */}
        <div className="flex flex-col md:flex-row md:justify-between mt-10 ">
          <div className=" flex flex-col">
            <h1 className="text-3xl md:text-4xl font-playfair">
              Experience Luxury Like Never before
            </h1>
            <div className="flex flex-wrap items-center mt-3 mb-6 gap-4">
              {room.amenities.map((item, index) => (
                <div key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100"
                >
                  <img src={facilityIcons[item]} alt={item} className="w-5 h-5" />
                  <p className="text-xs">{item}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Room Price */}
          <p className="text-2xl font-medium">${room.pricePerNight}/night</p>
        </div>

        {/**CheckIn Checkout form */}
        <form onSubmit={onSubmitHandler} noValidate className="bg-white shadow-[0px_0px_20px_rgba(0,0,0,0.15)] p-4 md:p-6 rounded-xl border border-gray-300 outline-none mx-auto mt-16 max-w-6xl">
          
          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col">
                <label htmlFor="checkInDate" className="font-medium text-gray-700 mb-1">Check-In</label>
                <input 
                  onChange={(e) => setCheckInDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]} 
                  type="date" 
                  id="checkInDate" 
                  name="checkInDate"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="checkOutDate" className="font-medium text-gray-700 mb-1">Check-Out</label>
                <input 
                  onChange={(e) => setCheckOutDate(e.target.value)} 
                  min={checkInDate} 
                  disabled={!checkInDate} 
                  type="date" 
                  id="checkOutDate" 
                  name="checkOutDate"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100" 
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="guests" className="font-medium text-gray-700 mb-1">Guests</label>
                <input 
                  onChange={(e) => setGuests(e.target.value)} 
                  value={guests} 
                  type="number" 
                  id="guests" 
                  name="guests"
                  min="1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isCheckingAvailability || isBooking || isBooked}
              className={`w-full transition-all text-white rounded-lg py-4 text-base font-semibold cursor-pointer shadow-lg disabled:cursor-not-allowed ${
                isBooked 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50'
              }`}
            >
              {isBooked ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Booked Successfully
                </span>
              ) : isBooking ? (
                "Booking..."
              ) : isCheckingAvailability ? (
                "Checking..."
              ) : isAvailable ? (
                "Book Now"
              ) : (
                "Check Availability"
              )}
            </button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-8 text-gray-500">
              <div className="flex flex-col">
                <label htmlFor="checkInDate" className="font-medium">Check-In</label>
                <input 
                  onChange={(e) => setCheckInDate(e.target.value)} 
                  min={new Date().toISOString().split('T')[0]} 
                  type="date" 
                  id="checkInDate" 
                  name="checkInDate"
                  className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none" 
                />
              </div>
              <div className="w-px h-15 bg-gray-300/70" />
              <div className="flex flex-col">
                <label htmlFor="checkOutDate" className="font-medium">Check-Out</label>
                <input 
                  onChange={(e) => setCheckOutDate(e.target.value)} 
                  min={checkInDate} 
                  disabled={!checkInDate} 
                  type="date" 
                  id="checkOutDate" 
                  name="checkOutDate"
                  className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none" 
                />
              </div>
              <div className="w-px h-15 bg-gray-300/70" />
              <div className="flex flex-col">
                <label htmlFor="guests" className="font-medium">Guests</label>
                <input 
                  onChange={(e) => setGuests(e.target.value)} 
                  value={guests} 
                  type="number" 
                  id="guests" 
                  name="guests"
                  min="1"
                  className="max-w-20 rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none" 
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isCheckingAvailability || isBooking || isBooked}
              className={`transition-all text-white rounded-md px-8 py-4 text-base cursor-pointer disabled:cursor-not-allowed ${
                isBooked 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50'
              }`}
            >
              {isBooked ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Booked Successfully
                </span>
              ) : isBooking ? (
                "Booking..."
              ) : isCheckingAvailability ? (
                "Checking..."
              ) : isAvailable ? (
                "Book Now"
              ) : (
                "Check Availability"
              )}
            </button>
          </div>
        </form>

        {/**common Specifications */}
        <div className="mt-25 space-y-4" >
          {roomCommonData.map((spec, index) => (
            <div key={index} className="flex items-center gap-2 ">
              <img src={spec.icon} alt={`${spec.title}-icon`} className="w-6.5" />
              <div>
                <p className="text-base">{spec.title}</p>
                <p className="text-gray-500">{spec.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-3xl border-y border-gray-300 my-15 py-10 text-gray-500">
          <p>guestss will be allocated on the ground floor according to availability. You get a comfortable Two bedroom apartment has a true city feeling. The price quoted is for two guests, at the guests slot please mark the number of guestss to get the exact price for groups. The guestss will be allocated ground floor according to availability. You get the comfortable two bedroom apartment that has a true city feeling.</p>
        </div>
        {/**Hosted by */}
        <div className="flex flex-col items-start gap-4">
          <div className="flex gap-4">
            <img src={room.hotel.owner.image} alt="Host" className="h-14 w-14 md:h-18 md:w-18 rounded-full" />
            <div>
              <p className="text-lg md:text-xl">Hosted by {room.hotel.name}</p>
              <div className="flex items-center mt-1">
                <StarRating />
                <p className="ml-2">200+ reviews</p>
              </div>
            </div>
          </div>
          <button className="px-6 py-2.5 mt-4 rounded text-white bg-primary hover:bg-blue-700 transition-all cursor-pointer">Contact Now</button>
        </div>
      </div>
    )
  );
};

export default RoomDetails;
