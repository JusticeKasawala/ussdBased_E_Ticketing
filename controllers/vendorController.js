const Vendor = require('../models/vendor');
 

exports.addVendor = async(req, res )=>{
    try {
        // get vname, num, market from the request body
        const { vendor_name, vendor_pnum, vendor_market, } = req.body;
        
        //check if vendor exist using pnum
       const existingVendor = await Vendor.findOne({ where: { vendor_pnum } });
       if (existingVendor) {
       return res.status(400).json({ message: 'vendor with this phone already exists' });
    }
    // Create new vendor
      const newVendor = await Vendor.create({ vendor_name, vendor_pnum, vendor_market});

      res.status(201).json({ message: 'vendor registered successfully', Vendor: newVendor });
    }
    catch(error){
        console.error('error adding a vendor', error);
        res.status(500).json({message: 'internal server error'})
    }
};
// get all vendors
exports.getAllVendors = async (req, res) => {
    try {
      // Logic for getting all vendors
      const vendors = await Vendor.findAll();
      res.status(200).json(vendors);
    } catch (error) {
      console.error('Error getting all vendors:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  // delete a vendor
  exports.deleteVendor = async (req, res) => {
    try {
      // Logic for deleting vendor by ID
      const { vendorId } = req.body;
      const vendor = await Vendor.findByPk(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'vendor not found' });
      }
      await vendor.destroy();
      res.status(200).json({ message: 'vendor deleted successfully' });
    } catch (error) {
      console.error('Error deleting vendor:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
//   return a vendor by id 
  exports.getVendorById = async (req, res) => {
    try {
      // Logic for fetching vendor by ID
      const vendorId = req.body.vendorId;
  
      // Find the vendor by ID
      const vendor = await Vendor.findByPk(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ vendor});
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };