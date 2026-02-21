// Admin Dashboard Logic for Boris Enterprises
// Handles: admin verification, appointments management, customer list, filtering
// Called by auth.js via initAdminDashboard() and showAdminAccessDenied()

(function() {
  'use strict';

  // Store all appointments for client-side filtering
  var allAppointments = [];
  var currentFilter = 'all';

  // --- Utility Functions ---
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    var date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function formatDateShort(timestamp) {
    if (!timestamp) return 'N/A';
    var date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // --- Show Admin Access Denied ---
  // Called by auth.js when logged-in user is not an admin
  window.showAdminAccessDenied = function() {
    var loading = document.getElementById('adminLoading');
    var denied = document.getElementById('access-denied');
    var content = document.getElementById('admin-content');

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'none';
    if (denied) denied.style.display = 'flex';
  };

  // --- Initialize Admin Dashboard ---
  // Called by auth.js when user is verified as admin
  window.initAdminDashboard = function(user) {
    var loading = document.getElementById('adminLoading');
    var denied = document.getElementById('access-denied');
    var content = document.getElementById('admin-content');

    if (loading) loading.style.display = 'none';
    if (denied) denied.style.display = 'none';
    if (content) content.style.display = 'block';

    // Load data
    loadAppointments();
    loadCustomers();

    // Set up filter tabs
    initFilterTabs();
  };

  // --- Load Appointments ---
  function loadAppointments() {
    var container = document.getElementById('appointments-list');
    if (!container) return;

    db.collection('appointments')
      .orderBy('createdAt', 'desc')
      .get()
      .then(function(snapshot) {
        if (snapshot.empty) {
          allAppointments = [];
          updateStats();
          container.innerHTML = '<p class="empty-state">No appointments yet.</p>';
          return;
        }

        allAppointments = [];
        snapshot.forEach(function(doc) {
          var data = doc.data();
          data._id = doc.id;
          allAppointments.push(data);
        });

        updateStats();
        renderAppointments();
      })
      .catch(function(error) {
        console.error('Error loading appointments:', error);
        container.innerHTML = '<p class="empty-state">Error loading appointments. Please try again.</p>';
      });
  }

  // --- Update Stats ---
  function updateStats() {
    var total = allAppointments.length;
    var pending = 0;
    var approved = 0;
    var denied = 0;

    for (var i = 0; i < allAppointments.length; i++) {
      var status = allAppointments[i].status || 'pending';
      if (status === 'pending') pending++;
      else if (status === 'approved') approved++;
      else if (status === 'denied') denied++;
    }

    var statTotal = document.getElementById('stat-total');
    var statPending = document.getElementById('stat-pending');
    var statApproved = document.getElementById('stat-approved');
    var statDenied = document.getElementById('stat-denied');

    if (statTotal) statTotal.textContent = total;
    if (statPending) statPending.textContent = pending;
    if (statApproved) statApproved.textContent = approved;
    if (statDenied) statDenied.textContent = denied;
  }

  // --- Render Appointments ---
  function renderAppointments() {
    var container = document.getElementById('appointments-list');
    if (!container) return;

    // Filter appointments based on current filter
    var filtered = allAppointments;
    if (currentFilter !== 'all') {
      filtered = allAppointments.filter(function(appt) {
        return (appt.status || 'pending') === currentFilter;
      });
    }

    if (filtered.length === 0) {
      var msg = currentFilter === 'all'
        ? 'No appointments yet.'
        : 'No ' + currentFilter + ' appointments.';
      container.innerHTML = '<p class="empty-state">' + escapeHtml(msg) + '</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      html += buildAppointmentCard(filtered[i]);
    }
    container.innerHTML = html;
  }

  // --- Build Appointment Card HTML ---
  function buildAppointmentCard(appt) {
    var id = appt._id;
    var status = appt.status || 'pending';
    var statusClass = '';
    if (status === 'pending') statusClass = 'status-pending';
    else if (status === 'approved') statusClass = 'status-approved';
    else if (status === 'denied') statusClass = 'status-denied';

    var customerName = appt.userName || 'Unknown';
    var customerEmail = appt.userEmail || '';
    var customerPhone = appt.userPhone || '';

    var vehicleStr = '';
    if (appt.vehicleYear || appt.vehicleMake || appt.vehicleModel) {
      vehicleStr = (appt.vehicleYear || '') + ' ' + (appt.vehicleMake || '') + ' ' + (appt.vehicleModel || '');
      vehicleStr = vehicleStr.trim();
      if (appt.licensePlate) {
        vehicleStr += ' (' + appt.licensePlate + ')';
      }
    }

    var preferredDate = appt.preferredDate || 'N/A';
    var message = appt.message || '';
    var submittedDate = formatTimestamp(appt.createdAt);

    var html = '';
    html += '<div class="admin-appt-card" id="appt-' + escapeHtml(id) + '">';
    html += '  <div class="appt-details">';
    html += '    <div class="appt-customer">' + escapeHtml(customerName) + '</div>';

    if (customerEmail) {
      html += '    <div class="appt-date">' + escapeHtml(customerEmail) + '</div>';
    }
    if (customerPhone) {
      html += '    <div class="appt-date">' + escapeHtml(customerPhone) + '</div>';
    }
    if (vehicleStr) {
      html += '    <div class="appt-vehicle">' + escapeHtml(vehicleStr) + '</div>';
    }

    html += '    <div class="appt-date">Preferred Date: ' + escapeHtml(preferredDate) + '</div>';

    if (message) {
      html += '    <div class="appt-message">' + escapeHtml(message) + '</div>';
    }

    html += '    <div class="appt-date">Submitted: ' + escapeHtml(submittedDate) + '</div>';
    html += '    <div style="margin-top: 6px;"><span class="appointment-status ' + statusClass + '">' + escapeHtml(status) + '</span></div>';
    html += '  </div>';

    // Action buttons (only for pending appointments)
    html += '  <div class="appt-actions" id="appt-actions-' + escapeHtml(id) + '">';
    if (status === 'pending') {
      html += '    <button class="btn-approve" onclick="approveAppointment(\'' + escapeHtml(id) + '\')">Approve</button>';
      html += '    <button class="btn-deny" onclick="denyAppointment(\'' + escapeHtml(id) + '\')">Deny</button>';
    }
    html += '  </div>';

    html += '</div>';
    return html;
  }

  // --- Approve Appointment ---
  window.approveAppointment = function(appointmentId) {
    db.collection('appointments').doc(appointmentId).update({
      status: 'approved',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
      // Update local data and find the appointment object
      var appointment = null;
      for (var i = 0; i < allAppointments.length; i++) {
        if (allAppointments[i]._id === appointmentId) {
          allAppointments[i].status = 'approved';
          appointment = allAppointments[i];
          break;
        }
      }
      updateStats();
      refreshAppointmentCard(appointmentId, 'approved');

      // Send email notification (fire-and-forget)
      if (appointment && appointment.userEmail) {
        try {
          db.collection('mail').add({
            to: appointment.userEmail,
            message: {
              subject: 'Appointment Approved — Boris Enterprises',
              html: '<h2 style="color: #CC1A1A; font-family: Arial, sans-serif;">Boris Enterprises</h2>'
                + '<p style="font-family: Arial, sans-serif;">Hi ' + escapeHtml(appointment.userName) + ',</p>'
                + '<p style="font-family: Arial, sans-serif;">Great news! Your appointment for your <strong>'
                + escapeHtml(appointment.vehicleYear) + ' ' + escapeHtml(appointment.vehicleMake) + ' ' + escapeHtml(appointment.vehicleModel)
                + '</strong> has been <strong style="color: green;">approved</strong>.</p>'
                + '<p style="font-family: Arial, sans-serif;"><strong>Date:</strong> ' + escapeHtml(appointment.preferredDate || 'ASAP') + '</p>'
                + '<p style="font-family: Arial, sans-serif;">If you need to reschedule or have questions, give us a call at <strong>231-675-0723</strong>.</p>'
                + '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">'
                + '<p style="font-family: Arial, sans-serif; color: #888; font-size: 12px;">Boris Enterprises<br>9890 Whitfield Rd, East Jordan, MI 49727<br>231-675-0723</p>'
            }
          });
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }
      }
    }).catch(function(error) {
      console.error('Error approving appointment:', error);
      alert('Error approving appointment. Please try again.');
    });
  };

  // --- Deny Appointment ---
  window.denyAppointment = function(appointmentId) {
    db.collection('appointments').doc(appointmentId).update({
      status: 'denied',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
      // Update local data and find the appointment object
      var appointment = null;
      for (var i = 0; i < allAppointments.length; i++) {
        if (allAppointments[i]._id === appointmentId) {
          allAppointments[i].status = 'denied';
          appointment = allAppointments[i];
          break;
        }
      }
      updateStats();
      refreshAppointmentCard(appointmentId, 'denied');

      // Send email notification (fire-and-forget)
      if (appointment && appointment.userEmail) {
        try {
          db.collection('mail').add({
            to: appointment.userEmail,
            message: {
              subject: 'Appointment Update — Boris Enterprises',
              html: '<h2 style="color: #CC1A1A; font-family: Arial, sans-serif;">Boris Enterprises</h2>'
                + '<p style="font-family: Arial, sans-serif;">Hi ' + escapeHtml(appointment.userName) + ',</p>'
                + '<p style="font-family: Arial, sans-serif;">Unfortunately, we are unable to accommodate your requested appointment for your <strong>'
                + escapeHtml(appointment.vehicleYear) + ' ' + escapeHtml(appointment.vehicleMake) + ' ' + escapeHtml(appointment.vehicleModel)
                + '</strong> at this time.</p>'
                + '<p style="font-family: Arial, sans-serif;">Please give us a call at <strong>231-675-0723</strong> and we will find a time that works.</p>'
                + '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">'
                + '<p style="font-family: Arial, sans-serif; color: #888; font-size: 12px;">Boris Enterprises<br>9890 Whitfield Rd, East Jordan, MI 49727<br>231-675-0723</p>'
            }
          });
        } catch (emailError) {
          console.error('Error sending denial email:', emailError);
        }
      }
    }).catch(function(error) {
      console.error('Error denying appointment:', error);
      alert('Error denying appointment. Please try again.');
    });
  };

  // --- Refresh a Single Appointment Card After Status Change ---
  function refreshAppointmentCard(appointmentId, newStatus) {
    var card = document.getElementById('appt-' + appointmentId);
    if (!card) return;

    // Update the status badge
    var statusBadge = card.querySelector('.appointment-status');
    if (statusBadge) {
      statusBadge.className = 'appointment-status status-' + newStatus;
      statusBadge.textContent = newStatus;
    }

    // Remove action buttons
    var actionsContainer = document.getElementById('appt-actions-' + appointmentId);
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
    }

    // If current filter doesn't match new status, re-render
    if (currentFilter !== 'all' && currentFilter !== newStatus) {
      renderAppointments();
    }
  }

  // --- Filter Tabs ---
  function initFilterTabs() {
    var tabs = document.querySelectorAll('.filter-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function() {
        var filter = this.getAttribute('data-filter');

        // Update active tab
        var allTabs = document.querySelectorAll('.filter-tab');
        for (var j = 0; j < allTabs.length; j++) {
          allTabs[j].classList.remove('active');
        }
        this.classList.add('active');

        // Apply filter
        currentFilter = filter;
        renderAppointments();
      });
    }
  }

  // --- Load Customers ---
  function loadCustomers() {
    var container = document.getElementById('customers-list');
    if (!container) return;

    db.collection('users')
      .get()
      .then(function(snapshot) {
        if (snapshot.empty) {
          container.innerHTML = '<p class="empty-state">No customers yet.</p>';
          return;
        }

        var html = '';
        snapshot.forEach(function(doc) {
          var c = doc.data();
          var memberSince = formatDateShort(c.createdAt);

          html += '<div class="admin-customer-card">';
          html += '  <div class="customer-info">';
          html += '    <span class="customer-name">' + escapeHtml(c.name || 'Unknown') + '</span>';
          html += '    <span class="customer-email">' + escapeHtml(c.email || '') + '</span>';
          if (c.phone) {
            html += '    <span class="customer-phone">' + escapeHtml(c.phone) + '</span>';
          }
          html += '  </div>';
          html += '  <div class="customer-meta" style="text-align: right; font-size: 0.8rem; color: #999;">';
          html += '    Member since ' + escapeHtml(memberSince);
          html += '  </div>';
          html += '</div>';
        });
        container.innerHTML = html;
      })
      .catch(function(error) {
        console.error('Error loading customers:', error);
        container.innerHTML = '<p class="empty-state">Error loading customers. Please try again.</p>';
      });
  }

})();
