import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';

class User extends Model {
  // Instance method to validate password
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  // Associations
  static associate(models) {
    User.hasMany(models.Project, {
      foreignKey: 'created_by',
      as: 'projects',
    });
    User.hasMany(models.BackendNode, {
      foreignKey: 'created_by',
      as: 'backendNodes',
    });
    User.hasMany(models.FrontendNode, {
      foreignKey: 'created_by',
      as: 'frontendNodes',
    });
    User.hasMany(models.Branch, {
      foreignKey: 'created_by',
      as: 'branches',
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'manager'),
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true, // Creates created_at, updated_at automatically
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['status'] },
      { fields: ['role'] },
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && !user.password.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && !user.password.startsWith('$2b$')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
