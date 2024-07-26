import { Request, Response, NextFunction } from 'express';

import { BookService } from '../../services/bookService';
import { BadRequest, NotFound } from '../../utils/errors';
import { redis } from '../../config/redis';
import { IBook, IDeleteBook, IFindBooks } from '../../types/types';

const {
  findBooks,
  findById,
  findBySlug,
  findSearch,
  findByGroupFields,
  findBooksRandom,
  findRelatedBooks,
  findMoreBooksAuthors,
  findMostViewedBooks,
  createBook,
  updateBook,
  removeBook,
} = BookService;

async function getBooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IFindBooks>> {
  const { body } = req;
  const key = `books_${body}`;
  const { page, limit, offset } = req.pagination!;

  try {
    // Verifica si hay paginación
    if (!limit || !page) {
      // Eliminamos la cache
      await redis.del(key);
      // Si no hay paginación, simplemente llama al servicio y retorna la respuesta
      const { results, totalBooks } = await findBooks(limit, offset);

      return res.status(200).json({
        totalBooks,
        results,
      });
    }

    // Se elimina la cache cuando se busca por paginación
    if (limit && page) await redis.del(key);

    // Se leen los datos almacenados en cache
    const cachedData = await redis.get(key);

    // Si hay datos en la cache se envian al cliente
    if (cachedData) {
      const cachedResponse = JSON.parse(cachedData);
      return res.status(200).json(cachedResponse);
    }

    // Llamar al servicio que ejecuta las consultas
    const { results, totalBooks } = await findBooks(limit, offset);

    req.calculatePagination!(totalBooks);

    // Aquí construimos el objeto de respuesta que incluye los resultados de la consulta y la información de paginación
    const response = {
      info: req.paginationInfo,
      results,
    };

    // Si no hay datos en la cache, se envian a redis los datos de la base
    await redis.set(key, JSON.stringify(response));

    // Expiramos la cache cada 5 minutos
    await redis.expire(key, 300);

    if (results.length < 1) {
      throw NotFound('No se encontraron más libros');
    }

    return res.status(200).json(response);
  } catch (err) {
    return next(err) as any;
  }
}

async function getSearchBooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook[]>> {
  const { q } = req.query;

  try {
    const results = await findSearch(q);

    if (results.length < 1) {
      throw NotFound(`No se encontraron resultados para: ${q}`);
    }

    return res.status(200).json(results);
  } catch (err) {
    return next(err) as any;
  }
}

async function getAllOptions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook[]>> {
  try {
    const result = await findByGroupFields();

    return res.status(200).json(result);
  } catch (err) {
    return next(err) as any;
  }
}

async function getBooksRandom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook[]>> {
  try {
    const result = await findBooksRandom();

    return res.status(200).json(result);
  } catch (err) {
    return next(err) as any;
  }
}

async function getRelatedBooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook[]>> {
  const { id } = req.params;

  try {
    const relatedBooks = await findRelatedBooks(id);

    return res.status(200).json(relatedBooks);
  } catch (err) {
    return next(err) as any;
  }
}

async function getMoreBooksAuthors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook[]>> {
  const { id } = req.params;

  try {
    const moreBooksAuthors = await findMoreBooksAuthors(id);

    return res.status(200).json(moreBooksAuthors);
  } catch (err) {
    return next(err) as any;
  }
}

async function getOneBooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook[] | null>> {
  const { id } = req.params;

  try {
    const result = await findById(id);

    if (!result) {
      throw NotFound('No se encuentra o no existe');
    }

    return res.status(200).json(result);
  } catch (err) {
    return next(err) as any;
  }
}

async function getPathUrlBooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook[] | null>> {
  const { pathUrl } = req.params;

  try {
    const result = await findBySlug(pathUrl);

    if (!result) {
      throw NotFound('No se encuentra o no existe');
    }

    return res.status(200).json(result);
  } catch (err) {
    return next(err) as any;
  }
}

async function getMostViewedBooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook[]>> {
  const { detail } = req.query;

  try {
    if (!detail || (detail !== 'summary' && detail !== 'full')) {
      throw BadRequest('Parámetro detail inválido');
    }

    const result = await findMostViewedBooks(detail as string);

    return res.status(200).json(result);
  } catch (err) {
    return next(err) as any;
  }
}

async function postBooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook>> {
  const { body } = req;

  try {
    const resultBook = await createBook(body);

    if (!resultBook) {
      throw BadRequest('Error al publicar, la solicitud está vacia');
    }

    redis.expire(`books_${req.body}`, 0);
    return res.status(201).json(resultBook);
  } catch (err) {
    return next(err) as any;
  }
}

async function putBooks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IBook | null>> {
  const { id } = req.params;
  const { body } = req;

  try {
    const result = await updateBook(id, body);

    if (!result) {
      throw BadRequest('No se pudo actualizar');
    }

    return res.status(201).json(result);
  } catch (err) {
    return next(err) as any;
  }
}

async function deleteBook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<IDeleteBook>> {
  const { id } = req.params;

  try {
    const book = await removeBook(id);

    if (!book) {
      throw NotFound('Libro no encontrado');
    }

    return res.status(200).json({ success: { message: 'Libro eliminado' } });
  } catch (err) {
    return next(err) as any;
  }
}

export {
  getBooks,
  getSearchBooks,
  getAllOptions,
  getBooksRandom,
  getRelatedBooks,
  getMoreBooksAuthors,
  getOneBooks,
  getPathUrlBooks,
  getMostViewedBooks,
  postBooks,
  putBooks,
  deleteBook,
};
