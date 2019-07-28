/*eslint no-invalid-this:0*/
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import crypto from 'crypto';
const authTypes = ['github', 'google', 'linkedin'];

var UserSchema = new Schema({
    name: String,
    email: {
        type: String,
        lowercase: true,
        required() {
            return authTypes.indexOf(this.provider) === -1;
        }
    },
    role: {
        type: String,
        default: 'user'
    },
    imageId: Schema.ObjectId,
    smallImageId: Schema.ObjectId,
    hashedPassword: {
        type: String,
        required() {
            return authTypes.indexOf(this.provider) === -1;
        }
    },
    provider: String,
    providers: {type: Object, default: {
        local: false,
        google: false,
        linkedin: false,
        github: false
    }},
    salt: String,
    google: {},
    linkedin: {},
    github: {}
});

function validatePresenceOf(value) {
    return value && value.length;
}

/**
 * Virtuals
 */
UserSchema
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });

// Public profile information
UserSchema
    .virtual('profile')
    .get(function() {
        return {
            name: this.name,
            role: this.role,
            imageId: this.imageId,
            smallImageId: this.smallImageId
        };
    });

// Non-sensitive info we'll be putting in the token
UserSchema
    .virtual('token')
    .get(function() {
        return {
            _id: this._id,
            role: this.role
        };
    });

/**
 * Validations
 */

// Validate empty email
UserSchema
    .path('email')
    .validate(function(email) {
        if(authTypes.indexOf(this.provider) !== -1) {
            return true;
        }
        if(!email) {
            return false;
        }
        return email.length;
    }, 'Email cannot be blank');

// Validate empty password
UserSchema
    .path('hashedPassword')
    .validate(function(hashedPassword) {
        return authTypes.indexOf(this.provider) !== -1 || hashedPassword.length;
    }, 'Password cannot be blank');

// Validate email is not taken
UserSchema
    .path('email')
    .validate(function(value) {
        if(authTypes.indexOf(this.provider) !== -1) {
            return Promise.resolve(true);
        }

        return this.constructor.findOne({email: value}).exec()
            .then(user => {
                if(user) {
                    if(this.id === user.id) {
                        return true;
                    }
                    return false;
                }
                return true;
            })
            // .catch(function(err) {
            //     throw err;
            // });
    }, 'The specified email address is already in use.');

/**
 * Pre-save hook
 */
UserSchema
    .pre('save', function(next) {
        if(!this.isNew) {
            return next();
        } else if(!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1) {
            return next(new Error('Invalid password'));
        } else {
            return next();
        }
    });

/**
 * Methods
 */
UserSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     * @param {String} plainText - plaintext password to check
     * @return {Boolean} - true if the password, hashed & salted, matches the saved hashed password
     * @api public
     */
    authenticate(plainText) {
        return this.encryptPassword(plainText) === this.hashedPassword;
    },

    /**
     * Make salt
     * @return {String} - returns a new Adam Vanderwall
     * @api public
     */
    makeSalt() {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     * @param {String} password - password to encrypt
     * @return {String} - hashed & salted password
     * @api public
     */
    encryptPassword(password) {
        if(!password || !this.salt) return '';
        let salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha1').toString('base64');
    },
};

export default mongoose.model('User', UserSchema);
