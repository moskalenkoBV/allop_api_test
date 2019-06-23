const StationModel = require('../models/Station');

const OFFSET = 0;
const LIMIT = 50;
const SORT = 'name';
const DISTANCE = 10;
const QUERY_PARAMS = [
  'id',
  'name',
  'type',
  'status',
  'mobile_intervention_department_code',
  'fixed_latitude',
  'fixed_longitude',
  'max_distance',
  'mobile_intervention_zip_code',
  'email',
  'phone',
  'network_slug',
  'partnership_slug',
  'shipment_type',
  'location_slug',
  'company_id',
  'quality_labels',
];

exports.getStations = (req, res) => {
  const query = {};

  for (let key in req.query) {
    if (!QUERY_PARAMS.includes(key)) continue;

    switch (key) {
      case 'id':
        query._id = req.query[key];
        break;
      case 'name':
      case 'email':
        query[key] = {
          $regex: req.query[key]
        };
        break;
      case 'fixed_latitude':
      case 'fixed_longitude':
      case 'max_distance':
        if (!!query.location || !req.query.fixed_latitude || !req.query.fixed_latitude) break;

        query.location = {
          $near: {
            $maxDistance: (+req.query.max_distance || DISTANCE) * 1000,
            $geometry: {
              type: "Point",
              coordinates: [+req.query.fixed_longitude, +req.query.fixed_latitude],
            },
          },
        };
        break;
      case 'quality_labels':
        queryObject[key] = {
          $all: req.query.split(':')
        };
        break;
      default:
        query[key] = req.query[key];
        break;
    }
  }

  StationModel.count(query, (error, count) => {
    if (error) {
      res.status(400).json({ ...error, code: 400, message: 'getStations: Cant get CountDocuments of Stations' });
      return;
    }

    const limit = +req.query.limit || LIMIT;
    const offset = +req.query.offset || OFFSET;
    const sort = req.query.sort || SORT;

    StationModel.find(query)
      .limit(limit)
      .skip(offset * limit)
      .sort(sort)
      .exec((error, items) => {
        if (error) {
          res.status(400).json({ ...error, code: 400, message: 'getStations: Cant find Stations' })
        } else {
          res.status(200).json({
            items,
            offset,
            limit,
            count: count < limit ? 1 : (offset * limit) + 1,
            total: count
          })
        }
      })
  });
};

exports.getStation = (req, res) => {
  StationModel.findOne({ _id: req.params.id }, '-zones', (error, item) => {
    if (error) {
      res.status(400).json({ ...error, code: 400, message: 'getStation: Cant findOne Station' })
    }
    else if (item == null) {
      res.status(404).json({ ...error, code: 404, message: 'Station not found' })
    } else {
      res.status(200).json(item);
    }
  });
};
