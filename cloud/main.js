
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

function getSequence(className,callback) {
    var Entity = Parse.Object.extend("Sequence");
    var query = new Parse.Query(Entity);
    query.equalTo("class", className);
        //console.log('Getting the Sequence object');
    query.first({ 
        success: function(object) {
            object.increment('sequence');
            object.save(null,{
                success:function(object) {
                    callback(object.get('sequence'));
                },
                error:function(object,error) {
                    callback(undefined);
                }
            });
        }, error: function (error) {
            console.log(error);
            callback(undefined);
        }
    });
};

Parse.Cloud.beforeSave("Article", function (request, response) { 

	var Entity = Parse.Object.extend("Article");
    var query = new Parse.Query(Entity);
    // Add query filters to check for uniqueness
    query.equalTo("groupId", "1002");
    query.first().then(function(existingObject) {
      if (existingObject) {
        // Update existing object. here you can do all the object updates you want 
        //if (request.object.get("columnToUpdate") != undefined){
          existingObject.set('name','JWT');
        //}
        return existingObject.save();
        response.error();
      } else {
        // Pass a flag that this is not an existing object
        //return Parse.Promise.as(false);
		var className = "Article";
		getSequence(className,function(sequence) { 
			if (sequence) {
				request.object.set("bindingByte", sequence);
				response.success();
			} else {
				response.error('Could not get a sequence.');
			}
		});
      }
    }).then(function(existingObject) {
      if (existingObject) {
        // Existing object, stop initial save
        response.error("Existing object");
      } else {
        // New object, let the save go through
        var className = "Article";
		getSequence(className,function(sequence) { 
			if (sequence) {
				request.object.set("bindingByte", sequence);
				response.success();
			} else {
				response.error('Could not get a sequence.');
			}
		});
      }
    }, function (error) {
      response.error(error);
    });
  
});

Parse.Cloud.beforeSave("Inventory", function (request, response) { 

    if (request.object.isNew()) {
      var className = "Inventory";
        getSequence(className,function(sequence) { 
            if (sequence) {
                request.object.set("inventoryID", sequence);
                response.success();
            } else {
                response.error('Could not get a sequence.')
            }
        });
    } else {
        response.success();
    }

});

Parse.Cloud.afterSave("Item", function(request) {
  if(!request.object.existed()){
  query = new Parse.Query("Inventory");
  query.get(request.object.get("parentInventory").id, {
    success: function(post) {
      post.increment("countTypeItem");
      post.save();
    },
    error: function(error) {
      response.error("Got an error " + error.code + " : " + error.message);
    }
  });
    }
});
