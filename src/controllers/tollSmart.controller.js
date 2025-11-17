import fetch from "node-fetch";
import dotenv from "dotenv";
import { DateTime } from "luxon";
import axios from "axios";

dotenv.config();

// ----------------------------
// Geocoder (Nominatim)
// ----------------------------
const geocodeAddress = async (address) => {
  try {
    const query = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "EmailCheckerExtension/1.0 (support@nvmailer.uz)" }
    });

    const data = await res.json();
    if (!data.length) throw new Error(`No results for: ${address}`);

    return {
      latitude: +data[0].lat,
      longitude: +data[0].lon
    };
  } catch (err) {
    console.error(`❌ Geocoding failed for "${address}":`, err.message);
    return null;
  }
};

// ----------------------------
// TollSmart Controller
// ----------------------------
// export const TollSmart = async (req, res) => {
//   try {
//     const { addresses } = req.body;

//     if (!Array.isArray(addresses) || addresses.length < 2) {
//       return res.status(400).json({ success: false, message: "At least two addresses required." });
//     }

//     console.log("📍 Addresses:", addresses);

//     // Force US EASTERN TIME
//     const easternNow = DateTime.now()
//       .setZone("America/New_York")
//       .toISO(); // ISO string in EST

//     console.log("🕒 Using Eastern Time:", easternNow);

//     // Geocode all addresses
//     const coords = [];
//     for (const addr of addresses) {
//       const loc = await geocodeAddress(addr);
//       if (loc) coords.push(loc);
//       await new Promise(r => setTimeout(r, 1000));
//     }

//     if (coords.length < 2) {
//       return res.status(400).json({ success: false, message: "Could not geocode enough addresses." });
//     }

//     const origin = coords[0];
//     const destination = coords[coords.length - 1];
//     const waypoints = coords.slice(1, -1);

//     // Tractor Trailer Payload
//     const payload = {
//       origin,
//       destination,
//       waypoints,
//       key: process.env.TOLLSMART_API_KEY,

//       timestamp: easternNow,

//       usa_accounts: [],

//       vehicle: {
//         vehicle_type: "tractor_trailer",

//         is_truck: true,
//         is_commercial: true,
//         has_trailer: true,
//         is_special_load: false,

//         weight: 80000,
//         height: 162,
//         width: 102,
//         length: 888,

//         total_number_of_axles: 5,
//         number_of_axles_without_trailer: 3,
//         trailer_number_of_axles: 2,

//         has_dual_tires: true,
//         trailer_has_dual_tires: true,
//       },

//       options: {
//         include_route: true,
//         include_tolls_details: true
//       }
//     };

//     console.log("🚛 Sending request to TollSmart...");

//     const response = await fetch("http://api.tollsmart.com/TollsAPI/osm/calculate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload)
//     });

//     if (!response.ok) {
//       const text = await response.text();
//       return res.status(response.status).json({ success: false, message: text });
//     }


//     const data = await response.json();
//     const routeData = data[0] || {};

//     // --- Select highest toll ---
//     let fee = {};
//     if (Array.isArray(routeData.total_tolls_fees) && routeData.total_tolls_fees.length > 0) {
//       fee = routeData.total_tolls_fees.reduce((max, cur) => {
//         const curValue = cur.total_cash_value || 0;
//         const maxValue = max.total_cash_value || 0;
//         return curValue > maxValue ? cur : max;
//       });
//     }


//     const miles = (routeData.distance_meters || 0) / 1609.34;

//     const summary = {
//       distanceMiles: +miles.toFixed(2),
//       durationHours: +((routeData.duration_seconds || 0) / 3600).toFixed(2),

//       cashPrice: fee.total_cash_value || 0,
//       transponderPrice: fee.total_etc_value || fee.total_cash_value || 0,

//       currency: fee.currency || "USD"
//     };

//     console.log("🔥 FINAL RESULT:", summary);

//     return res.status(200).json({ success: true, summary });

//   } catch (err) {
//     console.error("⚠ TollSmart Error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

export const TollSmart = async (req, res) => {
  try {
    const { addresses } = req.body;

    if (!Array.isArray(addresses) || addresses.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least two addresses required."
      });
    }

    console.log("📍 Addresses:", addresses);

    // Force US EASTERN TIME
    const easternNow = DateTime.now()
      .setZone("America/New_York")
      .toISO();

    console.log("🕒 Using Eastern Time:", easternNow);

    // Geocode all addresses
    const coords = [];
    for (const addr of addresses) {
      const loc = await geocodeAddress(addr);
      if (loc) coords.push(loc);
      await new Promise(r => setTimeout(r, 1000));
    }

    if (coords.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Could not geocode enough addresses."
      });
    }

    const origin = coords[0];
    const destination = coords[coords.length - 1];
    const waypoints = coords.slice(1, -1);

    // Payload
    const payload = {
      origin,
      destination,
      waypoints,
      key: process.env.TOLLSMART_API_KEY,
      timestamp: easternNow,
      usa_accounts: [],
      vehicle: {
        vehicle_type: "tractor_trailer",
        is_truck: true,
        is_commercial: true,
        has_trailer: true,
        is_special_load: false,
        weight: 80000,
        height: 162,
        width: 102,
        length: 888,
        total_number_of_axles: 5,
        number_of_axles_without_trailer: 3,
        trailer_number_of_axles: 2,
        has_dual_tires: true,
        trailer_has_dual_tires: true
      },
      options: {
        include_route: true,
        include_tolls_details: true
      }
    };

    console.log("🚛 Sending AXIOS request to TollSmart...");

    // 🚀 AXIOS POST
    const axiosResponse = await axios.post(
      "http://api.tollsmart.com/TollsAPI/osm/calculate",
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 20000 // 20s timeout
      }
    );

    const data = axiosResponse.data;
    const routeData = data[0] || {};

    // --- Select highest toll ---
    let fee = {};
    if (
      Array.isArray(routeData.total_tolls_fees) &&
      routeData.total_tolls_fees.length > 0
    ) {
      fee = routeData.total_tolls_fees.reduce((max, cur) => {
        const curValue = cur.total_cash_value || 0;
        const maxValue = max.total_cash_value || 0;
        return curValue > maxValue ? cur : max;
      });
    }

    const miles = (routeData.distance_meters || 0) / 1609.34;

    const summary = {
      distanceMiles: +miles.toFixed(2),
      durationHours: +((routeData.duration_seconds || 0) / 3600).toFixed(2),
      cashPrice: fee.total_cash_value || 0,
      transponderPrice: fee.total_etc_value || fee.total_cash_value || 0,
      currency: fee.currency || "USD"
    };

    console.log("🔥 FINAL AXIOS RESULT:", summary);

    return res.status(200).json({ success: true, summary });

  } catch (err) {
    console.error("⚠ TollSmart Axios Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};