/*
 * ------------------------------------------------------------------------
 *
 *  Copyright by KNIME AG, Zurich, Switzerland
 *  Website: http://www.knime.com; Email: contact@knime.com
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License, Version 3, as
 *  published by the Free Software Foundation.
 *
 *  This program is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, see <http://www.gnu.org/licenses>.
 *
 *  Additional permission under GNU GPL version 3 section 7:
 *
 *  KNIME interoperates with ECLIPSE solely via ECLIPSE's plug-in APIs.
 *  Hence, KNIME and ECLIPSE are both independent programs and are not
 *  derived from each other. Should, however, the interpretation of the
 *  GNU GPL Version 3 ("License") under any applicable laws result in
 *  KNIME and ECLIPSE being a combined program, KNIME AG herewith grants
 *  you the additional permission to use and propagate KNIME together with
 *  ECLIPSE with only the license terms in place for ECLIPSE applying to
 *  ECLIPSE and the GNU GPL Version 3 applying for KNIME, provided the
 *  license terms of ECLIPSE themselves allow for the respective use and
 *  propagation of ECLIPSE together with KNIME.
 *
 *  Additional permission relating to nodes for KNIME that extend the Node
 *  Extension (and in particular that are based on subclasses of NodeModel,
 *  NodeDialog, and NodeView) and that only interoperate with KNIME through
 *  standard APIs ("Nodes"):
 *  Nodes are deemed to be separate and independent programs and to not be
 *  covered works.  Notwithstanding anything to the contrary in the
 *  License, the License does not apply to Nodes, you are not required to
 *  license Nodes under the License, and you are granted a license to
 *  prepare and propagate Nodes, in each case even if such Nodes are
 *  propagated with or for interoperation with KNIME.  The owner of a Node
 *  may freely choose the license terms applicable to such Node, including
 *  when such Node is propagated with or for interoperation with KNIME.
 * ---------------------------------------------------------------------
 *
 * History
 *   11 Feb 2025 (chaubold): created
 */
package org.knime.scripting.editor;

import java.util.Arrays;
import java.util.stream.Stream;

/**
 * Utilities to extract names and types of columns and flow variables in {@link InputOutputModel}s.
 *
 * @since 5.5
 * @author Carsten Haubold, KNIME GmbH, Konstanz, Germany
 */
public final class InputOutputModelNameAndTypeUtils {
    private InputOutputModelNameAndTypeUtils() {
    }

    /**
     * A pair of name and type that can be used to describe columns or flow variables
     *
     * @param name
     * @param type
     *
     */
    public static record NameAndType(String name, String type) {
    }

    /**
     * Returns all table columns (sub-items) from all table InputOutputModels, concatenated into one flattened
     * NameAndType array.
     *
     * @param models an array of InputOutputModel objects
     * @return a flattened NameAndType array representing all columns from all tables; returns an empty array if there
     *         are no table models or no sub-items.
     */
    public static NameAndType[] getAllSupportedTableColumns(final InputOutputModel[] models) {
        return Arrays.stream(models) //
            .filter(m -> InputOutputModel.TABLE_PORT_TYPE_NAME.equals(m.portType())) //
            .flatMap(m -> { //
                InputOutputModel.InputOutputModelSubItem[] subItems = m.subItems(); //
                return subItems == null ? Stream.empty() : Arrays.stream(subItems); //
            }) //
            .filter(subItem -> subItem.supported()) //
            .map(subItem -> new NameAndType(subItem.name(), subItem.type())) //
            .toArray(NameAndType[]::new);
    }

    /**
     * Returns all table models (i.e. those whose portType equals TABLE_PORT_TYPE_NAME) converted to an array of arrays
     * of NameAndType – one array per table (each table’s columns are represented by its subItems).
     *
     * @param models an array of InputOutputModel objects
     * @return a two-dimensional NameAndType array (each inner array holds the columns for one table) that only contains
     *         the supported columns
     */
    public static NameAndType[][] getAllTables(final InputOutputModel[] models) {
        return getTablesMatchingNamePrefix(models, "");
    }

    /**
     * Returns all table models (i.e. those whose portType equals TABLE_PORT_TYPE_NAME) that have the given string as
     * name prefix converted to an array of arrays of NameAndType – one array per table (each table’s columns are
     * represented by its subItems).
     *
     * @param models an array of InputOutputModel objects
     * @param namePrefix The name prefix that tables need to match to be included in the output
     * @return a two-dimensional NameAndType array (each inner array holds the columns for one table) that only contains
     *         the supported columns
     */
    public static NameAndType[][] getTablesMatchingNamePrefix(final InputOutputModel[] models,
        final String namePrefix) {
        return getModelsMatchingNamePrefix(models, InputOutputModel.TABLE_PORT_TYPE_NAME, namePrefix);
    }

    /**
     * Returns all table models (i.e. those whose portType equals TABLE_PORT_TYPE_NAME) that have the given string as
     * name prefix converted to an array of arrays of NameAndType – one array per table (each table’s columns are
     * represented by its subItems).
     *
     * @param models an array of InputOutputModel objects
     * @param typeName The port type name (see {@link InputOutputModel})
     * @param namePrefix The name prefix that tables need to match to be included in the output
     * @return a two-dimensional NameAndType array (each inner array holds the columns for one table) that only contains
     *         the supported columns
     */
    public static NameAndType[][] getModelsMatchingNamePrefix(final InputOutputModel[] models, final String typeName,
        final String namePrefix) {
        return Arrays.stream(models) //
            .filter(m -> typeName.equals(m.portType())) //
            .filter(m -> m.name().startsWith(namePrefix)) //
            .map(m -> { //
                InputOutputModel.InputOutputModelSubItem[] subItems = m.subItems();
                if (subItems == null) {
                    return new NameAndType[0];
                }
                return Arrays.stream(subItems) //
                    .filter(subItem -> subItem.supported()) //
                    .map(subItem -> new NameAndType(subItem.name(), subItem.type())) //
                    .toArray(NameAndType[]::new);
            }) //
            .toArray(NameAndType[][]::new);
    }

    /**
     * Returns all supported flow variables from the single (first) flow variable InputOutputModel. It is assumed that
     * there is exactly one InputOutputModel whose portType equals FLOW_VAR_PORT_TYPE_NAME. The subItems of that model
     * are the flow variables, and each subItem's name and type are used.
     *
     * @param models an array of InputOutputModel objects
     * @return a NameAndType array representing the flow variables; an empty array if none found.
     */
    public static NameAndType[] getSupportedFlowVariables(final InputOutputModel[] models) {
        InputOutputModel flowVariableModel = Arrays.stream(models)
            .filter(m -> InputOutputModel.FLOW_VAR_PORT_TYPE_NAME.equals(m.portType())).findFirst().orElse(null);

        if (flowVariableModel == null || flowVariableModel.subItems() == null) {
            return new NameAndType[0];
        }

        return Arrays.stream(flowVariableModel.subItems()) //
            .filter(subItem -> subItem.supported()) //
            .map(subItem -> new NameAndType(subItem.name(), subItem.type())) //
            .toArray(NameAndType[]::new);
    }
}
