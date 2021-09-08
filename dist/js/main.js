import { addSpiner, displayError, updateScreenReaderConfirmation, displayApiError, setPlaceholderText, updateDisplay } from "./domFunctions.js";
import { setLocationObject, getHomeLocation, cleanText, getCoordsFromApi, getWeatherFromCoords } from "./dataFunctions.js";
import CurrentLocation from "./CurrentLocation.js";

const currentLoc = new CurrentLocation();



const initApp = () => {
    // add listeners
    const geoButton = document.getElementById("getLocation");
    geoButton.addEventListener("click", getGeoWeather);
    const homeButton = document.getElementById("home");
    homeButton.addEventListener("click", loadWeather);
    const saveButton = document.getElementById("saveLocation");
    saveButton.addEventListener("click", saveLocation);
    const unitButton = document.getElementById("unit")
    unitButton.addEventListener("click", setUnitPref);
    const refreshButton = document.getElementById("refresh");
    refreshButton.addEventListener("click", refreshWeather);
    const locationEntry = document.getElementById("searchBar__form");
    locationEntry.addEventListener("submit", submitNewLocation);
    // set up
    setPlaceholderText();
    // load default weather
    loadWeather();
};

document.addEventListener("DOMContentLoaded", initApp);

const getGeoWeather = (event) => {
    if (event) {
        if (event.type  === "click") {
            const mapIcon = document.querySelector(".fa-map-marker-alt");
            addSpiner(mapIcon);
        }
    }
    if (!navigator.geolocation) geoError();
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
};

const geoError = (errObj) => {
    const errMsg = errObj ? errObj.message : "Geolocation not supported";
    displayError(errMsg, errMsg);
}

const geoSuccess = (position) => {
    const myCoordsObj = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        name: `Lat:${Math.round(Number(position.coords.latitude)* 100) / 100} Long:${Math.round(Number(position.coords.longitude)* 100) / 100}`
    };
    //set location obj
    setLocationObject(currentLoc, myCoordsObj);
    //console.log(position);
    updateDataAndDisplay(currentLoc);
    
};

const loadWeather = (event) => {
    const savedLocation = getHomeLocation();
    if (!savedLocation && !event) return getGeoWeather();
    if (!savedLocation && event.type === "click") {
        displayError("No Home Location Saved", "Sorry. Please save your home location first.");
    }
    else if(savedLocation && !event) {
        displayHomeLocationWeather(savedLocation);
    }
    else {
        const homeIcon = document.querySelector(".fa-home");
        addSpiner(homeIcon);
        displayHomeLocationWeather(savedLocation);
    }

};

const saveLocation = () => {
    if (currentLoc.getLat() && currentLoc.getLon()) {
        const saveIcon = document.querySelector(".fa-save");
        addSpiner(saveIcon);

        const location = {
            name: currentLoc.getName(),
            lat: currentLoc.getLat(),
            lon: currentLoc.getLon(),
            unit: currentLoc.getUnit()
        };
        localStorage.setItem("defaultWeatherLocation", JSON.stringify(location));
        updateScreenReaderConfirmation(`Saved ${currentLoc.getName()} as home location.`);
        updateDataAndDisplay(currentLoc);
    }
}



const displayHomeLocationWeather = (home) => {
    if (typeof home === "string") {
        const locationJson = JSON.parse(home);
        const myCoordsObj = {
            lat: locationJson.lat,
            lon: locationJson.lon,
            name: locationJson.name,
            unit: locationJson.units
        };
        setLocationObject(currentLoc, myCoordsObj);
        updateDataAndDisplay(currentLoc);
    }
};


const setUnitPref = () => {
    const unitIcon = document.querySelector(".fa-chart-bar");
    addSpiner(unitIcon);
    currentLoc.toggleUnit();
    updateDataAndDisplay(currentLoc);
};

const refreshWeather = () => {
    const refreshIcon = document.querySelector(".fa-sync-alt");
    addSpiner(refreshIcon);
    updateDataAndDisplay(currentLoc);
};


const submitNewLocation = async (event) => {
    event.preventDefault();
    const text = document.getElementById("searchBar__text").value;
    const entryText = cleanText(text);
    if (!entryText.length) return;
    const locationIcon = document.querySelector(".fa-search");
    addSpiner(locationIcon);
    const coordsData = await getCoordsFromApi(entryText, currentLoc.getUnit());

    if (coordsData) {
        if (coordsData.cod === 200) {

            const myCoordsObj = {
                lat: coordsData.coord.lat,
                lon: coordsData.coord.lon,
                name: coordsData.sys.country ? `${coordsData.name}, ${coordsData.sys.country}` : coordsData.name
            };
            setLocationObject(currentLoc, myCoordsObj);
            updateDataAndDisplay(currentLoc);
            setPlaceholderText();
        }
        else {
            displayApiError(coordsData);
        }
    }
    else {
        displayError("Connection Error", "Connection Error");
    }
    
};



const updateDataAndDisplay = async (locationObj) => {
    const weatherJson = await getWeatherFromCoords(locationObj);
    //console.log(weatherJson);
    if (weatherJson) updateDisplay(weatherJson, locationObj);


};


