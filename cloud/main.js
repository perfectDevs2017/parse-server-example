
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

    var groupId = request.object.get("groupId");
    var name = request.object.get("name");
    var quantity = request.object.get("quantity");
    //Do not re-declare the class
    var query = new Parse.Query("Article");
    //Check for existing Article
    query.equalTo("groupId", groupId);

    query.first().then(function (object) {

      if (object) {
        //Article exists and needs updating.
        // Do not save the object attached to the request.
        //Instead, update existing object.
        object.set('name', name);
        object.set('quantity', quantity);
        response.success();
      } else {
        //Continuing and save the new Article object because it is not a duplicate.
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
    },
    function (error) {
      response.error("Error: " + error.code + " " + error.message);
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
