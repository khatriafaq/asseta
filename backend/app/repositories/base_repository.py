from typing import Generic, TypeVar

from sqlmodel import SQLModel, Session, select

ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: type[ModelT], session: Session):
        self.model = model
        self.session = session

    def get_by_id(self, id: int) -> ModelT | None:
        return self.session.get(self.model, id)

    def list_all(self, **filters) -> list[ModelT]:
        stmt = select(self.model)
        for key, value in filters.items():
            if value is not None:
                stmt = stmt.where(getattr(self.model, key) == value)
        return list(self.session.exec(stmt).all())

    def create(self, obj: ModelT) -> ModelT:
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def update(self, obj: ModelT, data: dict) -> ModelT:
        for key, value in data.items():
            if value is not None:
                setattr(obj, key, value)
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    def delete(self, obj: ModelT) -> None:
        self.session.delete(obj)
        self.session.commit()
