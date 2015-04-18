require 'rails/generators/base'
require 'rails/generators/active_record'

module ShopifyApp
  module Generators
    class ShopModelGenerator < Rails::Generators::Base
      include Rails::Generators::Migration
      source_root File.expand_path('../templates', __FILE__)

      def create_shop_model
        copy_file 'shop.rb', 'app/models/shop.rb'
      end

      def create_shop_migration
        copy_migration 'create_shops.rb'
      end

      def create_session_storage
        copy_file 'session_storage.rb', 'app/models/session_storage.rb'
      end

      def create_session_storage_initializer
        copy_file 'shopify_session_repository.rb', 'config/initializers/shopify_session_repository.rb', force: true
      end

      private

      def copy_migration(migration_name, config = {})
        migration_template(
          "db/migrate/#{migration_name}",
          "db/migrate/#{migration_name}",
          config
        )
      end

      # for generating a timestamp when using `create_migration`
      def self.next_migration_number(dir)
        ActiveRecord::Generators::Base.next_migration_number(dir)
      end
    end
  end
end
