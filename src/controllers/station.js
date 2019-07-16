const StationModel = require('../models/Station');
const geolib = require('geolib');

const OFFSET = 0;
const LIMIT = 50;
const SORT = 'name';
const DISTANCE = 10;
const QUERY_PARAMS = [
  'latitude',
  'longitude',
  'max_distance',
  'zip_code',
  'activity_id',
  'max_distance',
  'max_wheel_size',
  'front_filters',
  'company_id',
];

exports.postStations = (req, res) => {
  const query = {};


  if (Object.keys(req.query).length > 0) {
    Object.keys(req.query).forEach((key) => {
      if (!QUERY_PARAMS.includes(key)) return;
  
      switch (key) {
        case 'id':
        case 'activity_id':
        case 'company_id':
            query[key] = +req.query[key];
          break;
        case 'latitude':
        case 'longitude':
        case 'max_distance':
          if (!!query.location || !req.query.latitude || !req.query.longitude) break;
  
          query.location = {
            $near: {
              $maxDistance: (+req.query.max_distance || DISTANCE) * 1000,
              $geometry: {
                type: 'Point',
                coordinates: [+req.query.longitude, +req.query.latitude],
              },
            },
          };
          break;
        default:
          query[key] = req.query[key];
          break;
      }
    });
  }

  StationModel.count(query, (error, count) => {
    if (error) {
      res.status(400).json({ ...error, code: 400, message: 'postStations: Cant get CountDocuments of Stations' });
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
          res.status(400).json({ ...error, code: 400, message: 'postStations: Cant find Stations' })
        } else {
          (async () => {
            const outputItems = [];

            for (item of items) {
              let minPrice = null;
              let topType = null;

              await StationModel.findOne({ _id: item.id }, 'services', (error, data) => {
                if (data != null && data.services.length > 0) {
                  data.services.forEach(service => {
                    if (typeof service.price === 'number' && (minPrice === null || service.price < minPrice) ) {
                      minPrice = service.price;
                    }
                  });
                }
              });

              if (item.type !== 'fixed') {
                topType = 'mobile';
              } else if (item.priority === true) {
                topType = 'priority';
              } else if (item.partnership_slug === 'euromaster' || item.partnership_slug === 'euromaster_franchise') {
                topType = 'partnership';
              } else if (item.network_id === 203) {
                topType = 'network';
              }

              const itemData = {
                top_type: topType,
                price_from: minPrice,
                distance: geolib.getDistance({
                  latitude: +item.latitude,
                  longitude: +item.longitude,
                }, {
                  latitude: +req.query.latitude,
                  longitude: +req.query.longitude, 
                }) / 1000,
                station: item,
              };

              outputItems.push(itemData);
            }
            
            res.status(200).json({
              items: outputItems,
              offset,
              limit,
              count: count < limit ? 1 : (offset * limit) + 1,
              total: count
            })
          })();
        }
      })
  });
};

exports.getStations = (req, res) => {
  const query = {};

  for (let key in req.query) {
    if (!QUERY_PARAMS.includes(key)) continue;

    switch (key) {
      case 'id':
        query[key] = +req.query[key]
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
              type: 'Point',
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
  StationModel.findOne({ id: +req.params.id }, '-zones -zonesExtraCost -medias -services -schedules', (error, item) => {
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

exports.getStationZones = (req, res) => {
  StationModel.findOne({ id: +req.params.id }, 'zones', (error, item) => {
    if (error) {
      res.status(400).json({ ...error, code: 400, message: 'getStationZones: Cant findOne Station zones' });
    } else if (item == null) {
      res.status(404).json({ ...error, code: 404, message: 'Station not found' });
    } else {
      res.status(200).json(item.zones);
    }
  });
};

exports.getStationZonesExtraCost = (req, res) => {
  StationModel.findOne({ id: +req.params.id }, 'zonesExtraCost', (error, item) => {
    if (error) {
      res.status(400).json({ ...error, code: 400, message: 'getStationZones: Cant findOne Station zones extra cost' });
    } else if (item == null) {
      res.status(404).json({ ...error, code: 404, message: 'Station not found' });
    } else {
      res.status(200).json(item.zonesExtraCost);
    }
  });
};

exports.getStationMedias = (req, res) => {
  StationModel.findOne({ id: +req.params.id }, 'medias', (error, item) => {
    if (error) {
      res.status(400).json({ ...error, code: 400, message: 'getStationMedias: Cant findOne Station medias' });
    } else if (item == null) {
      res.status(404).json({ ...error, code: 404, message: 'Station not found' });
    } else {
      res.status(200).json(item.medias);
    }
  });
};

exports.getStationServices = (req, res) => {
  StationModel.findOne({ id: +req.params.id }, 'services', (error, item) => {
    if (error) {
      res.status(400).json({ ...error, code: 400, message: 'getStationServices: Cant findOne Station services' });
    } else if (item == null) {
      res.status(404).json({ ...error, code: 404, message: 'Station not found' });
    } else {
      res.status(200).json(item.services);
    }
  });
};

exports.getStationSchedules = (req, res) => {
  StationModel.findOne({ id: +req.params.id }, 'schedules', (error, item) => {
    if (error) {
      res.status(400).json({ ...error, code: 400, message: 'getStationSchedules: Cant findOne Station schedules' });
    } else if (item == null) {
      res.status(404).json({ ...error, code: 404, message: 'Station not found' });
    } else {
      res.status(200).json(item.schedules);
    }
  });
};
