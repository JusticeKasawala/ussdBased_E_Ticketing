
  document.addEventListener('DOMContentLoaded', () => {
    const marketSelect = document.getElementById('registration_market_name');
    const subofficeSelect = document.getElementById('registration_district_name');
  
    if (marketSelect && subofficeSelect) {
      fetch('/data')
        .then(response => response.json())
        .then(data => {
          // Populate markets dropdown
          data.markets.forEach(market => {
            const option = document.createElement('option');
            option.value = market.market_name;
            option.textContent = market.market_name;
            marketSelect.appendChild(option);
          });
  
          // Populate suboffices dropdown
          data.suboffices.forEach(suboffice => {
            const option = document.createElement('option');
            option.value = suboffice.suboffice_name;
            option.textContent = suboffice.suboffice_name;
            subofficeSelect.appendChild(option);
          });
        })
        .catch(error => console.error('Error fetching data:', error));
    } else {
      console.error('Market select or suboffice select element not found.');
    }
  });

