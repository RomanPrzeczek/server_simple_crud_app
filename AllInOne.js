"use strict";

// express consts
const express = require('express');
const cors = require('cors');
const app = express();

//dao consts, file system setup
const fs = require("fs");
const path = require("path");

const crypto = require("crypto");
const { func } = require('joi');

const rf = fs.promises.readFile;
const wf = fs.promises.writeFile;

const DEFAULT_STORAGE_PATH = path.join(__dirname, "storage", "items.json");

const storageItemsLimit = 10;

// Creating of Express application
app.use(cors());
app.use(express.json());

//Starting of server
app.listen(8000, () => {
    console.log(`Server is running on port 8000.`);
});


//GETTERS
// getting the items from storage
async function listItems() {
    let itemslist;
    try {
      itemslist = JSON.parse(await rf(DEFAULT_STORAGE_PATH));
      itemslist = itemslist.sort(function(a, b) {
        const nameA = a.name.toUpperCase(); // ignore upper and lowercase
        const nameB = b.name.toUpperCase(); // ignore upper and lowercase
        if (nameA > nameB) {
            return -1;
        }
        if (nameA < nameB) {
            return 1;
        }          
        // names must be equal
        return 0;
        });
    } catch (e) {
        console.log("Error read items stream > "+e)
    }
    return itemslist
};

async function getItem(itemID){
    let item;
    const items = await listItems();
    try{
        item=items.find((b) => b.id === itemID);
    }catch{
        console.log("Error find item id > "+e)
    }
    return item;
}

async function createItem(item){
    let itemsListforCreate = await listItems();
    item.id = crypto.randomBytes(8).toString("hex");
    if (itemsListforCreate.length < storageItemsLimit){
        itemsListforCreate.push(item);
        await wf(DEFAULT_STORAGE_PATH, JSON.stringify(itemsListforCreate, null, 2));
    } else console.log(`Reached storage limit - max ${storageItemsLimit} items. Please delete some item.`);
    return item;
}

async function updateItem(itemToUpdate){
    const updatedItemsList = await listItems();
    const itemIndex = updatedItemsList.findIndex((b) => b.id === itemToUpdate.id);
    if (itemIndex < 0) {
      throw new Error(`grade with given id ${itemToUpdate.id} does not exists`);
    } else {
        updatedItemsList[itemIndex] = {
        ...updatedItemsList[itemIndex],
        ...itemToUpdate,
      };
    }
    await wf(DEFAULT_STORAGE_PATH, JSON.stringify(updatedItemsList, null, 2));
    return updatedItemsList[itemIndex];
}

async function deleteItem(id) {
    let items = await listItems();
    const itemIndex = items.findIndex((b) => b.id === id);
    if (itemIndex >= 0) {
        items.splice(itemIndex, 1);
    }
    await wf(DEFAULT_STORAGE_PATH, JSON.stringify(items, null, 2));
    return {};
}

//ENDPOINTS
// creating endpoint for server communication res/req
async function ListAbl(req, res) {
    try {
      const items = await listItems();
      res.json(items);
    } catch (e) {
        console.log("Error ListAbl > "+e)
    }
};

async function GetAbl(req,res){
    const itemIDfromReq = req.params.id;
    try{
        const item = await getItem(itemIDfromReq);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
          }    
        res.json(item);
    }catch{
        console.log("Error GetAbl > "+e)
    }
};

async function CreateAbl(req,res){
    try{
        let newItem = req.body;
        newItem = await createItem(newItem);
        res.json(newItem);
        //console.log(`CreateAbl/res.json: ${(newItem)}`);
    }catch(e){
        console.log(`Error createAbl> ${e.message}`);
    }
}

async function UpdateAbl(req,res){
    try{
        let updatedItem = req.body;
        updatedItem = await updateItem(updatedItem);
        res.json(updatedItem);

    }catch(e){
        console.log(`Error updateAbl> ${e.message}`);
    }
}

async function DeleteAbl(req, res) {
    try {
        const delItemId = req.body.id;
        await deleteItem(delItemId);
        res.json({});
      }
    catch (e) {
        console.log(`Error deleteAbl> ${e.message}`);
    }
}

// express hendler
app.get("/list", async (req, res) => {
    await ListAbl(req, res);
});

app.get("/get/:id", async (req, res) => {
    await GetAbl(req,res);
});

app.post("/create",async (req,res) =>{
    await CreateAbl(req,res);
});

app.get('/limit', (req, res) => {
    res.json({ BElimit: storageItemsLimit });
  });

app.post("/update",async (req,res) =>{
    await UpdateAbl(req,res);
});

app.post("/delete",async (req,res) =>{
    await DeleteAbl(req,res);
});