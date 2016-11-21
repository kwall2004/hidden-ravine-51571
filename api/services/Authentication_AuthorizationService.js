/**
 * Created by chandrac on 2/8/2016.
 */
var jwt    = require('jsonwebtoken');
var Cryptr = require("cryptr");
var JWT_Issuer="DIMS_Authentication_Authorizaton_API_1.0";




module.exports = {

  encrypPassword:function(password)
  {
    var cryptoGraphy = new Cryptr('DIMSPasswords');
    var PWD=cryptoGraphy.encrypt(password)
    return PWD
  },
  decryptPassword:function(password)
  {
    var cryptoGraphy = new Cryptr('DIMSPasswords');
    var PWD=''

      try{

        PWD=cryptoGraphy.decrypt(password)
      }
    catch(err)
    {
      console.log("wrong password")
      return PWD
    }

    return PWD

  },

  findUser: function(whereCondition){

    return Users.findOne(whereCondition).then(function(userRecord){

      if( userRecord!=null)
      {
        return Manufacturers.findOne(userRecord.ParentOrganization.id ).then(function(manufactureRecord) {

          if( manufactureRecord!=null && manufactureRecord.Active)
          {

            return userRecord;
          }
          else
          {

            if( manufactureRecord==null)
            {

              return Customers.findOne(userRecord.ParentOrganization.id ).then(function(customersRecord) {

                if( customersRecord!=null && customersRecord.Active)
                {

                  return userRecord;
                }
                else {
                  return Promise.resolve(null)
                }



              })

            }
            else {
              return Promise.resolve(null)
            }


          }


        })
      }
      else
      {
        return Promise.resolve(null)
      }






    })

  },
  updatePasswordForUser:function(id,password,resetPassword)
  {

   return Users.update({id:id},{Password:module.exports.encrypPassword(password),ResetPassword:resetPassword})

  },

  getRole_Associated_EntitlementCodes:function( id){

    return  UserRoles.findOne(id)

  },

  generateRandomPassword:function(length)
  {

    var chars = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+<>ABCDEFGHIJKLMNOP1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
      var i = Math.floor(Math.random() * chars.length);
      pass += chars.charAt(i);
    }
    return pass;

  },



  generateJsonWebToken:function(userProfile,secret) {

    var tokenData= {

      userID: userProfile.userID,
      isPasswordResetRequired:userProfile.isPasswordResetRequired,
      issuedAt:userProfile.securityTerms.issuedAt
    }

    var JWT= jwt.sign(tokenData, secret, {issuer : JWT_Issuer})
    var cryptoGraphy = new Cryptr(secret);
    var token=cryptoGraphy.encrypt(JSON.stringify(tokenData))

    return token;

  },
  verifyAndDeleteToken:function (jwt,secret,userAgent)
  {
    if(jwt!=null) {
      var decoded = module.exports.verifyToken(jwt, secret)

      if (decoded != null ) {
       return redisService.deleteTokenFromUserActiveTokensList(decoded.userID, jwt).then(function(){
            return Promise.resolve(true)
        },
        function(){
          return Promise.resolve(true)
        })


      }
      else {
        return Promise.resolve(true)
      }
    }
    else {
      return Promise.resolve(true)
    }
  }

  ,verifyToken:function (token,secret)
  {
    try {
      var cryptoGraphy = new Cryptr(secret);
      var JWT=cryptoGraphy.decrypt(token)

      //var decoded = jwt.verify(JWT,secret,{issuer : JWT_Issuer});
      var decoded =JSON.parse(JWT)
      if(decoded!=null)
      {return decoded }
      else{
        return null
      }

    } catch(err) {
      return null
    }

  },

  isTokenValid:function(decoded,JWT,secret,userAgent,issuedTo)
  {



      return redisService.verifyWhetherToken_is_spoofed(JWT, decoded.userID,userAgent,issuedTo).then(function (result) {


          if (result.isSpoofed) {
            return {isTokenValid: false, reason: 'spoofed', errMessage: 'Token got expired / not issued by DIMS , please Re-Login '}
          }
          else {


            //check whether the user  profile is  modified after issuing this token.

            return  module.exports.findUser({where: {Login: decoded.userID}}).then( function ( user) {

                if (user != null  && user.Active) // User exits in DB
                {


                  if (new Date(user.updatedAt).getTime() == result.userProfile.securityTerms.lastUpdatedDateOfUserRecord && user.Role == result.userProfile.securityTerms.userRoleID) {
                        return module.exports.getRole_Associated_EntitlementCodes(user.Role).then( function ( userRole) {

                      if (new Date(userRole.updatedAt).getTime() == result.userProfile.securityTerms.lastUpdatedDateOfUserRoleRecord) {
                        result.userProfile["id"]=user.id
                        result.userProfile["name"]=user.Name
                        result.userProfile["userID"]=user.Login
                        result.userProfile["userID"]=user.Login
                        result.userProfile["parentOrganizationId"]=user.ParentOrganization.id

                        return Promise.resolve(  {isTokenValid: true,userProfile:result.userProfile})
                      }
                      else {
                        return Promise.resolve( {
                          isTokenValid: false,
                          reason: 'outDated', errMessage: 'User Role and Authorization Entitlements got updated , please Re-Login '
                        })
                      }


                    })

                  }
                  else {
                    return Promise.resolve( {
                      isTokenValid: false,
                      reason: 'outDated',
                      errMessage: 'User Profile got updated , please Re-Login '
                    })
                  }


                }
                else {


                  return Promise.resolve( {

                    isTokenValid: false,
                    reason: 'outDated',
                    errMessage: 'user deleted from the DataBase or user set to inactive status '
                  })
                }

              }
            )


          }
        }
      )



  },

filterCollectionBasedOnDataEntitlements:function(source,attributePathInSource,dataEntitlement)
{
  var filteredCollection=[]

  if(dataEntitlement == null)
  {
    return filteredCollection;
  }

if(dataEntitlement.indexOf("*")==-1 ) {
  if (source != null && attributePathInSource != null ) {
    var sourceRecordDataEntitlementValue = ''
    for (var i = 0; i < source.length; i++) {
      sourceRecordDataEntitlementValue = this.getValueBasedOnObjectPath(source[i], attributePathInSource)

      if (dataEntitlement.indexOf(sourceRecordDataEntitlementValue) != -1) {
        filteredCollection.push(source[i])
      }

    }


  }
  else
  {
   return  dataEntitlement;
  }


  return filteredCollection
}
else
{
  return source
}
},

  getValueBasedOnObjectPath:function(SourceObj,path)
  {
    var pathArray=path.split(".")

    var objValue=SourceObj[pathArray[0]];
    for(var i=1;i<pathArray.length;i++)
    {

        objValue=objValue[pathArray[i]]


    }

    return objValue
  }

}
