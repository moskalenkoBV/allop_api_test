const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  description: String,
  location_slug: String,
  $type: String,
  status: String,
  quality_labels: [String],
  company_id: Number,
  company_corporate_name: String,
  network_slug: String,
  network_id: Number,
  accept_reservation: Boolean,
  accept_guarding: Boolean,
  accept_order_email: Boolean,
  accept_information_request_email: Boolean,
  partnership_slug: String,
  shipment_type: String,
  payment_info: {
    card: Boolean,
    cash: Boolean,
    check: Boolean
  },
  address1: String,
  address2: String,
  zip_code: String,
  city: String,
  country: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },
  phone1: String,
  phone2: String,
  fax: String,
  email: String,
  site_url: String,
  supports_tpms_equipment: Boolean,
  tpms_equipement_id: Number,
  downtime_type: String,
  downtime_start: String,
  downtime_end: String,
  intervention_zones_display: String,
  created_at: Date,
  updated_at: Date,
  active_campaign_id: Number,
  priority: Boolean,
  label_subscription: Boolean,
  phone_two_displayed: Boolean,
  franchise_tool: Boolean,
  zones: [
    {
      department_code: String,
      department_name: String,
      $type: String,
      areas: [
        {
          slug: String,
          cities: [
            {
              zip_code: String,
              name: String
            }
          ]
        }
      ]
    }
  ],
  zonesExtraCost: [
    {
      department_code: String,
      department_name: String,
      cost: String,
      areas: [
        {
          slug: String,
          cities: [
            {
              zip_code: String,
              name: String
            }
          ],
          cost: String
        }
      ]
    }
  ]
}, { timestamps: true });

schema.index({ location: '2dsphere' });

module.exports = mongoose.model('stations', schema);
