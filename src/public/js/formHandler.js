import EventModel from '../../models/event.model.js';
// Global variable to store ticket types
let ticketTypes = [];

// Convert image file to Base64
async function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Validate form data
function validateFormData(formData) {
    const requiredFields = [
        'title',
        'addressProvince',
        'addressDetail',
        'startDate',
        'endDate',
        'category',
        'description',
        'venueName',
        'district'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
        throw new Error('At least one ticket type is required');
    }

    return true;
}

// Collect event data from form
async function collectEventData() {
    try {
        const eventLogoInput = document.getElementById('logo-image');
        const eventBannerInput = document.getElementById('banner-image');

        // Validate image inputs
        if (!eventLogoInput?.files?.length || !eventBannerInput?.files?.length) {
            throw new Error('Both logo and banner images are required');
        }

        // Convert images to Base64
        const eventLogo = await convertImageToBase64(eventLogoInput.files[0]);
        const eventBanner = await convertImageToBase64(eventBannerInput.files[0]);

        const formData = {
            title: document.getElementById('event-name').value,
            addressProvince: document.getElementById('city-province').value,
            addressDetail: document.getElementById('event-details').value,
            startDate: new Date(document.getElementById('start-time').value),
            endDate: new Date(document.getElementById('end-time').value),
            visitCount: 0,
            category: document.getElementById('event-category').value,
            status: "Active",
            ticketTypes: ticketTypes.map(ticket => ({
                name: ticket.name,
                price: Number(ticket.price),
                quantity: Number(ticket.quantity),
                description: ticket.description
            })),
            eventLogo,
            eventBanner,
            description: document.getElementById('description').value,
            eventType: document.querySelector('input[name="event-type"]:checked')?.value || null,
            venueName: document.getElementById('venue-name').value,
            district: document.getElementById('district').value,
        };

        // Validate form data
        validateFormData(formData);

        return formData;
    } catch (error) {
        console.error('Error collecting event data:', error);
        alert('Error: ' + error.message);
        throw error;
    }
}

// Add ticket type
function addTicketType() {
    const name = document.getElementById('ticketName').value;
    const price = document.getElementById('ticketPrice').value;
    const quantity = document.getElementById('totalTickets').value;
    const description = document.getElementById('ticketDescription').value;

    if (!name || !price || !quantity || !description) {
        alert('Please fill all ticket fields');
        return;
    }

    if (ticketTypes.some(ticket => ticket.name === name)) {
        alert('A ticket with this name already exists');
        return;
    }

    const ticketData = {
        name,
        price: Number(price),
        quantity: Number(quantity),
        description
    };

    ticketTypes.push(ticketData);
    document.getElementById('addTicketForm').style.display = 'none';
    clearTicketForm();
    displayTickets();
}

// Display tickets in UI
function displayTickets() {
    const ticketContainer = document.querySelector('.upload2');
    if (!ticketContainer) return;

    const ticketList = document.createElement('div');
    ticketList.classList.add('ticket-list');
    
    ticketList.innerHTML = ticketTypes.map((ticket, index) => `
        <div class="ticket-item">
            <div>
                <label class="ticket-type-name">${ticket.name}</label>
                <label class="ticket-type-price">Price: ${ticket.price}</label>
                <label class="ticket-type-quantity">Quantity: ${ticket.quantity}</label>
            </div>
            <button class="cancel-btn" onclick="removeTicket(${index})">x</button>
        </div>
    `).join('');

    const existingList = ticketContainer.querySelector('.ticket-list');
    if (existingList) {
        existingList.remove();
    }
    ticketContainer.appendChild(ticketList);
}

// Remove ticket
function removeTicket(index) {
    if (index >= 0 && index < ticketTypes.length) {
        ticketTypes.splice(index, 1);
        displayTickets();
    }
}

// Save event to database
async function saveDataToServer() {
  try {
      const formData = await collectEventData();
      
      // Tạo instance mới của EventModel
      const newEvent = new EventModel({
          eventName: formData.title,
          eventType: formData.eventType,
          logoImage: formData.eventLogo,
          bannerImage: formData.eventBanner,
          venue: {
              name: formData.venueName,
              cityProvince: formData.addressProvince,
              district: formData.district,
              details: formData.addressDetail
          },
          category: formData.category,
          description: formData.description,
          startTime: formData.startDate,
          endTime: formData.endDate,
          tickets: formData.ticketTypes.map(ticket => ({
              name: ticket.name,
              price: ticket.price,
              quantity: ticket.quantity,
              description: ticket.description
          })),
          status: formData.status
      });

      // Gửi request với instance của model
      const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(newEvent.toObject())
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save event');
      }

      const result = await response.json();
      console.log('Event saved successfully:', result);
      alert('Event saved successfully!');
      
      // Lưu ID event nếu cần
      if (result.data && result.data._id) {
          localStorage.setItem('currentEventId', result.data._id);
      }
      
      return true;

  } catch (error) {
      console.error('Error saving event:', error);
      alert('Error: ' + (error.message || 'Failed to save event'));
      return false;
  }
}

// Clear ticket form
function clearTicketForm() {
    document.getElementById('ticketName').value = '';
    document.getElementById('ticketPrice').value = '';
    document.getElementById('totalTickets').value = '';
    document.getElementById('ticketDescription').value = '';
}

// Export functions
export { 
    saveDataToServer,
    addTicketType,
    removeTicket,
    displayTickets,
    clearTicketForm
};