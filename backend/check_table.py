from app import create_app, db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    columns = inspector.get_columns('blockchain_transactions')
    print('Existing blockchain_transactions columns:')
    for col in columns:
        print(f"  {col['name']}: {col['type']}")
