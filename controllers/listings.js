const Listing = require("../models/listing");
const mapToken = process.env.MAP_TOKEN;

module.exports.index=async (req, res) => {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", {
            allListings
        });
    }

module.exports.renderNewForm=(req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res)=>{
        const {id}=req.params;

        const listing=await Listing.findById(id)
            .populate("owner")

            .populate({path:"reviews",
                populate:{
                    path:"author",
                },
            });

        if(!listing){
            req.flash("error","Listing you requested for does not exist!");
            return res.redirect("/listings");
        }

        console.log(listing);
        console.log("OWNER:",listing.owner);

        res.render("listings/show.ejs",{listing,  mapToken: process.env.MAP_TOKEN});
    };


   module.exports.createListing = async (req, res, next) => {

    const query = req.body.listing.location;

    const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${mapToken}`
    );

    const data = await response.json();

        let url=req.file.path;
        let filename=req.file.filename;
        console.log(url,"..",filename);
        const newListing=new Listing(req.body.listing);
        newListing.owner=req.user._id;
        newListing.image={url,filename};

        newListing.geometry=data.features[0].geometry;

       let savedListing= await newListing.save();
         console.log(savedListing);
        req.flash("success","New Listing Created!");
        res.redirect("/listings");
    };

module.exports.renderEditForm=async(req,res)=>{
    const {id}=req.params;

    const listing=await Listing.findById(id);

    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl=listing.image.url;

    if(originalImageUrl.includes("/upload/")){
        originalImageUrl=originalImageUrl.replace(
            "/upload/",
            "/upload/h_300,w_250/"
        );
    }

    res.render("listings/edit.ejs",{
        listing,
        originalImageUrl
    });
};
module.exports.updateListing=async (req, res) => {
        let { id } = req.params;
        let listing=await Listing.findByIdAndUpdate(
            id,
            {
                ...req.body.listing
            }
        );
         if(typeof req.file !=="undefined"){
         let url=req.file.path;
         let filename=req.file.filename;
         listing.image={url,filename};
         await listing.save();
         }
         req.flash("success","Listing Updated");

        res.redirect(`/listings/${id}`);
    };

module.exports.destroyListing=async (req, res) => {
        const { id } = req.params;

        await Listing.findByIdAndDelete(id);

        console.log("deletedListing");
        req.flash("success","Listing Deleted")

        res.redirect("/listings");
    };
