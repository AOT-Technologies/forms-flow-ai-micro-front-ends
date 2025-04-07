import "./Sidebar.scss";
import React, { useState, useEffect } from "react";
import moment from "moment";
import { WifiOff, Wifi } from "lucide-react";

const DateTimeNetworkWidget = () => {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDaytime, setIsDaytime] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = moment();
      setTime(now.format("HH:mm"));
      setDate(now.format("dddd, YYYY-MM-DD"));

      const hour = now.hour();
      setIsDaytime(hour >= 6 && hour < 18); // Sun between 6AM - 6PM
    };

    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const intervalId = setInterval(updateTime, 1000);
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    updateTime();
    updateNetworkStatus();

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  return (
    <div className="date-time-network-container">
      <div className="sun-moon-container">
        <div className={`sun-moon-icon ${isDaytime ? "sun" : "moon"}`} />
      </div>

      <div className="time">{time}</div>

      <div className="date">{date}</div>

      <div className="network-icon">
        {isOnline ? (
          <Wifi size={25} color="white" />
        ) : (
          <WifiOff size={25} color="red" />
        )}
      </div>
    </div>
  );
};

export default DateTimeNetworkWidget;
