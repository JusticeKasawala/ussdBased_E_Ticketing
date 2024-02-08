
const socket = io();
const districtSelect = $("#district_name");
const registrationDistrictSelect = $("#registration_district_name");
const marketSelect = $("#market_name");
const userTableBody = $("#userTableBody");
const addVendorButton = $("#addVendorButton");
const registrationForm = $("#registrationForm");

// Load districts on page load
$(document).ready(function () {
  // Fetch districts and populate the dropdowns
  fetchDistricts(districtSelect);
  fetchDistricts(registrationDistrictSelect);
  $("#searchButton").click(function () {
const searchQuery = $("#searchInput").val();
searchUsers(searchQuery);
});
});

// Event listener for district selection
districtSelect.change(function () {
  const selectedDistrict = $(this).val();
  // Fetch markets for the selected district
  fetchMarkets(selectedDistrict);
});

registrationDistrictSelect.change(function () {
  const selectedDistrict = $(this).val();
  // Fetch markets for the selected district in the registration form
  fetchMarkets(selectedDistrict);
});

// Event listener for market selection
marketSelect.change(function () {
  const selectedDistrict = districtSelect.val();
  const selectedMarket = $(this).val();
  // Fetch users for the selected district and market
  fetchUsers(selectedDistrict, selectedMarket);
});

// Event listener for add vendor button
addVendorButton.click(function () {
  registrationForm.toggle();
});
 // Function to search users based on the query
 function searchUsers(query) {
  $.ajax({
    url: "/api/search?query=" + query,
    method: "GET",
    success: function (users) {
      userTableBody.empty();
      if (users.length === 0) {
        // Display a message when no users match the search query
        userTableBody.append("<tr><td colspan='7'>No users found.</td></tr>");
      } else {
        // Display the matching users
        $.each(users, function (index, user) {
          const row = $("<tr>");
          row.html(
            "<td>" + user.id + "</td>" +
            "<td>" + user.name + "</td>" +
            "<td id='paymentStatus" + user.id + "' class='payment-status'>" + (user.payment_status === 'paid' ? 'Paid' : 'Unpaid') + "</td>" +
            "<td>" + user.market_name + "</td>" +
            "<td>" + user.markert_row_no + "</td>" +
            "<td>" + user.position + "</td>" +
            "<td>" + user.neighbor_name + "</td>"
          );
          userTableBody.append(row);
        });
      }
    },
    error: function (error) {
      console.error('Error searching users:', error);
    }
  });
}

// Fetch districts and populate the dropdown
function fetchDistricts(selectElement) {
  $.ajax({
    url: "/api/districts",
    method: "GET",
    success: function (data) {
      selectElement.empty();
      $.each(data.districts, function (index, district) {
        selectElement.append("<option value='" + district + "'>" + district + "</option>");
      });
      // Trigger change event to load markets for the first district
      selectElement.trigger("change");
    },
    error: function (error) {
      console.error('Error fetching districts:', error);
    }
  });
}

// Fetch markets for the selected district
function fetchMarkets(selectedDistrict) {
  $.ajax({
    url: "/api/markets?district=" + selectedDistrict,
    method: "GET",
    success: function (data) {
      marketSelect.empty();
      $.each(data.markets, function (index, market) {
        marketSelect.append("<option value='" + market + "'>" + market + "</option>");
      });
      // Trigger change event to load users for the first market
      marketSelect.trigger("change");
    },
    error: function (error) {
      console.error('Error fetching markets:', error);
    }
  });
}

// Fetch users for the selected district and market
function fetchUsers(selectedDistrict, selectedMarket) {
  $.ajax({
    url: "/api/users?district=" + selectedDistrict + "&market=" + selectedMarket,
    method: "GET",
    success: function (users) {
      userTableBody.empty();
      $.each(users, function (index, user) {
        const row = $("<tr>");
        row.html(
          "<td>" + user.id + "</td>" +
          "<td>" + user.name + "</td>" +
          "<td id='paymentStatus" + user.id + "' class='payment-status'>" + (user.payment_status === 'paid' ? 'Paid' : 'Unpaid') + "</td>" +
          "<td>" + user.market_name + "</td>" +
          "<td>" + user.markert_row_no + "</td>" +
          "<td>" + user.position + "</td>" +
          "<td>" + user.neighbor_name + "</td>"
        );
        userTableBody.append(row);
      });
    },
    error: function (error) {
      console.error('Error fetching users:', error);
    }
  });
}

// Socket.IO code for payment updates
socket.on("connect", () => {
  console.log("Socket connection established");
});

socket.on("paymentUpdate", (data) => {
  console.log("Received payment update:", data);
  const paymentStatusElement = $("#paymentStatus" + data.serialNumber);
  if (paymentStatusElement.length) {
    paymentStatusElement.text(data.paymentStatus === 'paid' ? 'Paid' : 'Unpaid');
    paymentStatusElement.addClass(data.paymentStatus === 'paid' ? 'paid' : 'unpaid');
    console.log("Updated payment status for user:", data.serialNumber);
  } else {
    console.log("Could not find payment status element for user:", data.serialNumber);
  }
});

